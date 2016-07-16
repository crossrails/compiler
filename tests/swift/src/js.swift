import Foundation
import JavaScriptCore

let bindings = MapTable<AnyObject, JSValue>(keyOptions: [.objectPointerPersonality, .weakMemory], valueOptions: [.objectPointerPersonality])

struct JSContext {
    
    let ref :JSContextRef
    
    init() {
        self.init(JSGlobalContextCreate(nil))
    }
    
    private init(_ ref :JSContextRef) {
        self.ref = ref
    }
    
    func eval(_ path :String) throws {
        let string = JSStringCreateWithCFString(try NSString(contentsOfFile: path, encoding: String.Encoding.utf8.rawValue) as String)
        let url = JSStringCreateWithCFString(path)
        defer {
            JSStringRelease(url)
            JSStringRelease(string)
        }
        _ = try self.invoke {
            JSEvaluateScript(self.ref, string, nil, url, 0, &$0)
        }
    }
    
    func invoke<T>( _ f: @noescape(inout exception :JSValueRef? ) -> T) throws -> T {
        var exception :JSValueRef? = nil
        let result = f(exception: &exception)
        if exception != nil {
            print("Exception thrown: \(String(self, ref: exception!))")
            throw Error(JSValue(self, ref: exception!))
        }
        return result
    }
    
}

public struct Error: ErrorProtocol, CustomStringConvertible {
    
    let exception :JSValue
    
    init(_ value: JSValue) {
        self.exception = value
    }
    
    public var description: String {
        return String(exception[message])
    }
}

private func cast(_ any :Any) -> JSValue? {
    if let object = any as? AnyObject {
        if let value = bindings.object(forKey: object) {
            return value
        }
    }
    return nil
}

func == (lhs: Any, rhs: Any) -> Bool {
    if let left = cast(lhs) {
        if let right = cast(rhs) {
            return try! left.context.invoke({
                JSValueIsEqual(left.context.ref, left.ref, right.ref, &$0)
            })
        }
    }
    return false
}

import Foundation
import JavaScriptCore

protocol JSFunction {
    func bind(_ object: AnyObject)
    func call(_ this :JSThis, args :JSValue...) throws -> JSValue
    func call(_ this :JSThis, args :[JSValue]) throws -> JSValue
}

extension JSValue : JSFunction {
    func call(_ this :JSThis, args :JSValue...) throws -> JSValue {
        return try self.call(this, args: args)
    }
    
    func call(_ this :JSThis, args :[JSValue]) throws -> JSValue {
        //        print("calling \(self) with \(args) on object \(this)")
        //        for arg in args {
        //            if(JSValueIsObject(context.ref, arg.ref)) {
        //                print("  Properties of arg \(arg)")
        //                let names = JSObjectCopyPropertyNames(context.ref, JSObjectGetPrototype(context.ref, arg.ref))
        //                for index in 0..<JSPropertyNameArrayGetCount(names) {
        //                    let name = JSPropertyNameArrayGetNameAtIndex(names, index)
        //                    print("  ...\(JSStringCopyCFString(nil, name))")
        //                }
        //            }
        //        }
        return try JSValue(self.context, ref: self.context.invoke {
            JSObjectCallAsFunction(self.context.ref, self.ref, this.ref, args.count, args.map({ $0.ref }), &$0)
        })
    }
}

import Foundation
import JavaScriptCore

protocol JSInstance : JSThis {
    func bind(_ object: AnyObject)
    func unbind(_ object: AnyObject)
}

extension JSValue : JSInstance {
    
    func bind(_ object: AnyObject) {
        bindings.setObject(self, forKey: object)
    }
    
    func unbind(_ object: AnyObject) {
        bindings.removeObject(forKey: object)
    }
}

extension JSContext {
    var globalObject : JSInstance {
        get {
            return JSValue(self, ref: JSContextGetGlobalObject(self.ref))
        }
    }
    
    func eval(_ path :String) throws -> JSInstance {
        try eval(path) as Void;
        return globalObject
    }
}

protocol JSClass : JSThis {
    func construct(_ args :JSValue...) throws -> JSInstance
}

extension JSValue : JSClass {
    func construct(_ args :JSValue...) throws -> JSInstance {
        return JSValue(context, ref: try context.invoke {
            JSObjectCallAsConstructor(self.context.ref, self.ref, args.count, args.map({ $0.ref}), &$0)
        })
    }
}


import Foundation
import JavaScriptCore

class JSObject : JSValue {
    
    private let object :AnyObject?
    private let callbacks: [String :([JSValue]) throws -> (JSValue?)]
    
    convenience init(_ context :JSContext, wrap object: AnyObject?) {
        self.init(context, object: object, callbacks: [:])
    }
    
    convenience init(_ context :JSContext, callback: ([JSValue]) throws -> (JSValue?)) {
        self.init(context, callbacks:["Function": callback])
        JSObjectSetPrototype(context.ref, self.ref, context.globalObject[Function].ref)
    }
    
    convenience init(_ context :JSContext, callbacks: [String :([JSValue]) throws -> (JSValue?)]) {
        self.init(context, object: nil, callbacks: callbacks)
    }
    
    convenience init(_ context :JSContext, prototype :JSThis, callbacks: [String :([JSValue]) throws -> (JSValue?)]) {
        self.init(context, object: nil, callbacks: callbacks)
        JSObjectSetPrototype(context.ref, JSObjectGetPrototype(context.ref, self.ref), prototype.ref)
    }
    
    private init(_ context :JSContext, object: AnyObject?, callbacks: [String :([JSValue]) throws -> (JSValue?)]) {
        self.object = object
        self.callbacks = callbacks
        var definition :JSClassDefinition = kJSClassDefinitionEmpty
        definition.finalize = {
            Unmanaged<JSObject>.fromOpaque(JSObjectGetPrivate($0)).release()
        }
        definition.callAsFunction = { (_, function, this, argCount, args, exception) -> JSValueRef? in
            let data = JSObjectGetPrivate(this)
            let object :JSObject = Unmanaged.fromOpaque((data == nil ? JSObjectGetPrivate(function) : data)!).takeUnretainedValue()
            do {
                let value = JSValue(object.context, ref: function!)
                var arguments = [JSValue]()
                for index in 0..<argCount {
                    arguments.append(JSValue(object.context, ref: (args?[index]!)!))
                }
                let callback = object.callbacks[String(value[name])]!
                return try callback(arguments)?.ref ?? JSValueMakeUndefined(object.context.ref)
            } catch let error as Error {
                exception?.initialize(with: error.exception.ref)
            } catch let error as CustomStringConvertible {
                var value: JSValueRef? = nil
                var message: JSValueRef?  = object.valueOf(error.description).ref
                value = JSObjectMakeError(object.context.ref, 1, &message, &value)
                exception?.initialize(with: value)
            } catch {
                var value : JSValueRef? = nil
                value = JSObjectMakeError(object.context.ref, 0, nil, &value)
                exception?.initialize(with: value)
            }
            return JSValueMakeUndefined(object.context.ref)
        }
        var functions: [JSStaticFunction] = callbacks.keys.map({
            JSStaticFunction(name: ($0 as NSString).utf8String, callAsFunction: definition.callAsFunction, attributes: UInt32(kJSPropertyAttributeNone))
        })
        functions.append(JSStaticFunction(name: nil, callAsFunction: nil, attributes: 0))
        definition.staticFunctions = UnsafePointer<JSStaticFunction>(functions)
        let clazz = JSClassCreate(&definition)
        super.init(context, ref: JSObjectMake(context.ref, clazz, nil))
        assert(JSObjectSetPrivate(ref, UnsafeMutablePointer(Unmanaged.passRetained(self).toOpaque())))
        JSClassRelease(clazz)
    }
    
    //    override func infer() -> Any? {
    //        return object ?? self
    //    }
}

import Foundation
import JavaScriptCore

let length : JSProperty = "length"
let message : JSProperty = "message"
let name : JSProperty = "name"
let Function : JSProperty = "Function"

struct JSProperty : CustomStringConvertible, StringLiteralConvertible {
    
    private let string :StringLiteralType
    let ref :JSStringRef
    
    init(unicodeScalarLiteral value: String) {
        self.string = value
        self.ref = JSStringCreateWithUTF8CString(value)
    }
    
    init(extendedGraphemeClusterLiteral value: String) {
        self.string = value
        self.ref = JSStringCreateWithUTF8CString(value)
    }
    
    init(stringLiteral value: StringLiteralType) {
        self.string = value
        self.ref = JSStringCreateWithUTF8CString(value)
    }
    
    var description: String {
        return string
    }
}

import Foundation
import JavaScriptCore

protocol JSThis : class {
    
    var ref : JSObjectRef { get }
    
    var context : JSContext { get }
    
    subscript(property: JSProperty) -> JSValue { get set }
    
    subscript(property: JSProperty) -> (_ :JSValue...) throws -> (JSValue) { get }
    
    func valueOf(_ value: Bool) -> JSValue
    
    func valueOf(_ value: Double) -> JSValue
    
    func valueOf(_ value: String) -> JSValue
    
    func valueOf<Wrapped>(_ value: Optional<Wrapped>, wrapped:@noescape(Wrapped) -> JSValue) -> JSValue
    
    func valueOf<Element>(_ value: Array<Element>, element:@noescape(Element) -> JSValue) -> JSValue
    
    func valueOf(_ object: AnyObject) -> JSValue?
    
    func valueOf(_ object: AnyObject, with eval :(JSContext) -> (JSValue)) -> JSValue
    
    func valueOf(_ value: Any?) -> JSValue
}

extension JSValue : JSThis {
    
    subscript(property: JSProperty) -> (_ :JSValue...) throws -> (JSValue) {
        get {
            return { (args :JSValue...) -> JSValue in try self[property].call(self, args: args) }
        }
    }
    
    func valueOf(_ value: Bool) -> JSValue {
        return JSValue(context, ref: JSValueMakeBoolean(context.ref, value))
    }
    
    func valueOf(_ value: Double) -> JSValue {
        return JSValue(context, ref: JSValueMakeNumber(context.ref, value))
    }
    
    func valueOf(_ value: String) -> JSValue {
        let string = JSStringCreateWithUTF8CString(value)
        defer {
            JSStringRelease(string)
        }
        return JSValue(context, ref: JSValueMakeString(context.ref, string))
    }
    
    func valueOf<Wrapped>(_ value: Optional<Wrapped>, wrapped:@noescape(Wrapped) -> JSValue) -> JSValue {
        return value == nil ? JSValue(context, ref: JSValueMakeNull(context.ref)) : wrapped(value!)
    }
    
    func valueOf<Element>(_ value: Array<Element>, element:@noescape(Element) -> JSValue) -> JSValue {
        return JSValue(context, ref: try! context.invoke {
            JSObjectMakeArray(self.context.ref, value.count, value.map({ element($0).ref }), &$0)
            })
    }
    
    func valueOf(_ object: AnyObject) -> JSValue? {
        return bindings.object(forKey: object)
    }
    
    func valueOf<T :AnyObject>(_ object: T, with eval :(JSContext) -> (JSValue)) -> JSValue {
        let value :JSValue? = bindings.object(forKey: object)
        return value ?? eval(context)
    }
    
    func valueOf(_ value :Any?) -> JSValue {
        switch value {
        case nil:
            return JSValue(context, ref: JSValueMakeNull(context.ref))
        case let bool as Bool:
            return self.valueOf(bool)
        case let double as Double:
            return self.valueOf(double)
        case let string as String:
            return self.valueOf(string)
        case let object as JSAnyObject:
            return object.this
        case let object as AnyObject:
            return JSObject(context, wrap: object)
        default:
            fatalError("Uknown type: \(value)")
        }
    }
    
}


//
//  JSValue.swift
//  SwiftJSCWrapper
//
//  Created by Andrew Reed on 26/05/2016.
//  Copyright © 2016 Crossrails. All rights reserved.
//

import Foundation
import JavaScriptCore

extension JSType : CustomStringConvertible {
    public var description: String {
        switch self {
        case kJSTypeNull:
            return "Null"
        case kJSTypeNumber:
            return "Number"
        case kJSTypeObject:
            return "Object"
        case kJSTypeString:
            return "String"
        case kJSTypeBoolean:
            return "Boolean"
        case kJSTypeUndefined:
            return "Undefined"
        default:
            return "Unknown"
        }
    }
}

class JSValue : CustomStringConvertible {
    
    let ref :JSValueRef
    let context :JSContext
    
    init(_ context :JSContext, ref :JSValueRef!) {
        self.ref = ref
        self.context = context
    }
    
    var description: String {
        return String(context, ref: ref)
    }
    
    subscript(property: JSProperty) -> JSValue {
        get {
            let value = try! context.invoke {
                JSObjectGetProperty(self.context.ref, self.ref, property.ref, &$0)
            }
            return JSValue(context, ref: value)
        }
        set(newValue) {
            try! context.invoke {
                JSObjectSetProperty(self.context.ref, self.ref, property.ref, newValue.ref, UInt32(kJSPropertyAttributeNone), &$0)
            }
        }
    }
    
    subscript(index: UInt32) -> JSValue {
        get {
            let value = try! context.invoke {
                JSObjectGetPropertyAtIndex(self.context.ref, self.ref, index, &$0)
            }
            return JSValue(context, ref: value)
        }
        set(newValue) {
            try! context.invoke {
                JSObjectSetPropertyAtIndex(self.context.ref, self.ref, index, newValue.ref, &$0)
            }
        }
    }
    
    func infer() -> Any {
        switch JSValueGetType(context.ref, ref) {
        case kJSTypeNumber:
            return Double(self)
        case kJSTypeObject:
            return JSAnyObject(self)
        case kJSTypeString:
            return String(self)
        case kJSTypeBoolean:
            return Bool(self)
        default:
            fatalError("Unknown type encounted: \(JSValueGetType(context.ref, ref))")
        }
    }
}

class JSAnyObject {
    
    let this :JSValue;
    
    init(_ instance :JSValue) {
        this = instance
        this.bind(self)
    }
    
    deinit {
        this.unbind(self)
    }
    
}

extension String {
    init(_ context: JSContext, ref: JSValueRef) {
        self = JSStringCopyCFString(nil, try! context.invoke {
            JSValueToStringCopy(context.ref, ref, &$0)
            }) as String
    }
}

extension Bool {
    init(_ value: JSValue) {
        assert(JSValueIsBoolean(value.context.ref, value.ref), "\(kJSTypeBoolean) expected but got \(JSValueGetType(value.context.ref, value.ref)): \(String(value.context, ref: value.ref))")
        self = JSValueToBoolean(value.context.ref, value.ref)
    }
}

extension Double {
    init(_ value: JSValue) {
        assert(JSValueIsNumber(value.context.ref, value.ref), "\(kJSTypeNumber) expected but got \(JSValueGetType(value.context.ref, value.ref)): \(String(value.context, ref: value.ref))")
        self = try! value.context.invoke {
            JSValueToNumber(value.context.ref, value.ref, &$0)
        }
    }
}

extension UInt32 {
    init(_ value: JSValue) {
        self = UInt32(Double(value))
    }
}

extension String {
    init(_ value: JSValue) {
        assert(JSValueIsString(value.context.ref, value.ref), "\(kJSTypeString) expected but got \(JSValueGetType(value.context.ref, value.ref)): \(String(value.context, ref: value.ref))")
        self.init(value.context, ref: value.ref)
    }
}

extension Optional {
    init(_ value: JSValue, wrapped:@noescape(JSValue) -> Wrapped) {
        self = JSValueIsNull(value.context.ref, value.ref) || JSValueIsUndefined(value.context.ref, value.ref) ? .none : wrapped(value)
    }
}

extension Array {
    init(_ value: JSValue, element:@noescape(JSValue) -> Element) {
        if #available(OSX 10.11, *) {
            assert(JSValueIsArray(value.context.ref, value.ref), "Array expected but got \(JSValueGetType(value.context.ref, value.ref)): \(String(value.context, ref: value.ref))")
        }
        self = [Element]()
        let count = UInt32(value[length])
        for index in 0..<count {
            self.append(element(value[index]))
        }
    }
}
