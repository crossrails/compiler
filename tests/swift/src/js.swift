//
//  js.swift
//  swift
//
//  Created by Nick Bransby-Williams on 11/03/2016.
//
//

import Foundation
import JavaScriptCore

private let bindings = NSMapTable(keyOptions: [.ObjectPointerPersonality, .WeakMemory], valueOptions: .ObjectPointerPersonality)

struct JSContext {
    
    let ref :JSContextRef
    
    init() {
        self.init(JSGlobalContextCreate(nil))
    }
    
    private init(_ ref :JSContextRef) {
        self.ref = ref
    }
    
    func eval(path :String) throws {
        let string = JSStringCreateWithCFString(try NSString(contentsOfFile: path, encoding: NSUTF8StringEncoding) as String)
        let url = JSStringCreateWithCFString(path)
        defer {
            JSStringRelease(url)
            JSStringRelease(string)
        }
        self.invoke {
            JSEvaluateScript(self.ref, string, nil, url, 0, &$0)
        }
    }
    
    func invoke<T>(@noescape f: (inout exception :JSValueRef ) -> T) -> T {
        var exception :JSValueRef = nil
        let result = f(exception: &exception)
        if exception != nil {
            print("Exception thrown: \(String(self, ref: exception))")
        }
        return result
    }
    
}

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

struct JSProperty : CustomStringConvertible, StringLiteralConvertible {
    
    private let string :StringLiteralType
    private let ref :JSStringRef
    
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

private let length : JSProperty = "length"
private let name : JSProperty = "name"
private let Function : JSProperty = "Function"

class JSValue : CustomStringConvertible {
    
    let ref :JSValueRef
    let context :JSContext
    
    init(_ context :JSContext, ref :JSValueRef) {
        self.ref = ref
        self.context = context
    }
    
    var description: String {
        return String(context, ref: ref)
    }
    
    subscript(property: JSProperty) -> JSValue {
        get {
            let value = context.invoke {
                JSObjectGetProperty(self.context.ref, self.ref, property.ref, &$0)
            }
            return JSValue(context, ref: value)
        }
        set(newValue) {
            context.invoke {
                JSObjectSetProperty(self.context.ref, self.ref, property.ref, newValue.ref, UInt32(kJSPropertyAttributeNone), &$0)
            }
        }
    }
    
    subscript(index: UInt32) -> JSValue {
        get {
            let value = context.invoke {
                JSObjectGetPropertyAtIndex(self.context.ref, self.ref, index, &$0)
            }
            return JSValue(context, ref: value)
        }
        set(newValue) {
            context.invoke {
                JSObjectSetPropertyAtIndex(self.context.ref, self.ref, index, newValue.ref, &$0)
            }
        }
    }
    
    func infer() -> Any? {
        switch JSValueGetType(context.ref, ref) {
        case kJSTypeNull:
            return nil
        case kJSTypeNumber:
            return Double(self)
        case kJSTypeObject:
            return self
        case kJSTypeString:
            return String(self)
        case kJSTypeBoolean:
            return Bool(self)
        case kJSTypeUndefined:
            return nil
        default:
            fatalError("Unknown type encounted")
        }
    }
}

class JSObject : JSValue {
    
    private let object :AnyObject?
    private let callbacks: [String :([JSValue]) -> (JSValue?)]
    
    convenience init(_ context :JSContext, wrap object: AnyObject?) {
        self.init(context, object: object, callbacks: [:])
    }
    
    convenience init(_ context :JSContext, callback: ([JSValue]) -> (JSValue?)) {
        self.init(context, callbacks:["Function": callback])
        JSObjectSetPrototype(context.ref, self.ref, context.globalObject[Function].ref)
    }
    
    convenience init(_ context :JSContext, callbacks: [String :([JSValue]) -> (JSValue?)]) {
        self.init(context, object: nil, callbacks: callbacks)
    }
    
    convenience init(_ context :JSContext, prototype :JSThis, callbacks: [String :([JSValue]) -> (JSValue?)]) {
        self.init(context, object: nil, callbacks: callbacks)
        JSObjectSetPrototype(context.ref, JSObjectGetPrototype(context.ref, self.ref), prototype.ref)
    }
    
    private init(_ context :JSContext, object: AnyObject?, callbacks: [String :([JSValue]) -> (JSValue?)]) {
        self.object = object
        self.callbacks = callbacks
        var definition :JSClassDefinition = kJSClassDefinitionEmpty
        definition.finalize = { Unmanaged<JSObject>.fromOpaque(COpaquePointer(JSObjectGetPrivate($0))).release() }
        definition.callAsFunction = { (_, function, this, argCount, args, _) -> JSValueRef in
            let data = JSObjectGetPrivate(this)
            let object :JSObject = Unmanaged.fromOpaque(COpaquePointer(data == nil ? JSObjectGetPrivate(function) : data)).takeUnretainedValue()
            let value = JSValue(object.context, ref: function)
            var arguments = [JSValue]()
            for index in 0..<argCount {
                arguments.append(JSValue(object.context, ref: args[index]))
            }
            let callback = object.callbacks[String(value[name])]!
            return callback(arguments)?.ref ?? JSValueMakeUndefined(object.context.ref)
        }
        var functions: [JSStaticFunction] = callbacks.keys.map({
            JSStaticFunction(name: ($0 as NSString).UTF8String, callAsFunction: definition.callAsFunction, attributes: UInt32(kJSPropertyAttributeNone))
        })
        functions.append(JSStaticFunction(name: nil, callAsFunction: nil, attributes: 0))
        definition.staticFunctions = UnsafePointer<JSStaticFunction>(functions)
        let clazz = JSClassCreate(&definition)
        super.init(context, ref: JSObjectMake(context.ref, clazz, nil))
        assert(JSObjectSetPrivate(ref, UnsafeMutablePointer(Unmanaged.passRetained(self).toOpaque())))
        JSClassRelease(clazz)
    }
    
    override func infer() -> Any? {
        return object ?? self
    }
}

private func cast(any :Any) -> JSValue? {
    if let value = any as? JSValue {
        return value
    } else if let object = any as? AnyObject {
        if let value = bindings.objectForKey(object) as? JSValue {
            return value
        }
    }
    return nil
}
    
func == (lhs: Any, rhs: Any) -> Bool {
    if let left = cast(lhs) {
        if let right = cast(rhs) {
            return left.context.invoke({
                JSValueIsEqual(left.context.ref, left.ref, right.ref, &$0)
            })
        }
    }
    return false
}

protocol JSFunction {
    func bind(object: AnyObject)
    func call(this :JSThis, args :JSValue...) -> JSValue
    func call(this :JSThis, args :[JSValue]) -> JSValue
}

extension JSValue : JSFunction {
    func call(this :JSThis, args :JSValue...) -> JSValue {
        return self.call(this, args: args)
    }
    
    func call(this :JSThis, args :[JSValue]) -> JSValue {
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
        return JSValue(self.context, ref: self.context.invoke {
            JSObjectCallAsFunction(self.context.ref, self.ref, this.ref, args.count, args.map({ $0.ref }), &$0)
        })
    }
}

protocol JSThis {
    
    var ref : JSObjectRef { get }

    var context : JSContext { get }

    subscript(property: JSProperty) -> JSValue { get set }
    
    subscript(property: JSProperty) -> (_ :JSValue...) -> (JSValue) { get }
    
    func valueOf(value: Bool) -> JSValue
    
    func valueOf(value: Double) -> JSValue
    
    func valueOf(value: String) -> JSValue
    
    func valueOf<Wrapped>(value: Optional<Wrapped>, @noescape wrapped:(Wrapped) -> JSValue) -> JSValue
    
    func valueOf<Element>(value: Array<Element>, @noescape element:(Element) -> JSValue) -> JSValue
    
    func valueOf(object: AnyObject) -> JSValue
    
    func valueOf(object: AnyObject, with eval :(JSContext) -> (JSValue)) -> JSValue

    func valueOf(value :Any?) -> JSValue
}

extension JSValue : JSThis {
    
    subscript(property: JSProperty) -> (_ :JSValue...) -> (JSValue) {
        get {
            return { (args :JSValue...) -> JSValue in self[property].call(self, args: args) }
        }
    }
    
    func valueOf(value: Bool) -> JSValue {
        return JSValue(context, ref: JSValueMakeBoolean(context.ref, value))
    }
    
    func valueOf(value: Double) -> JSValue {
        return JSValue(context, ref: JSValueMakeNumber(context.ref, value))
    }
    
    func valueOf(value: String) -> JSValue {
        let string = JSStringCreateWithUTF8CString(value)
        defer {
            JSStringRelease(string)
        }
        return JSValue(context, ref: JSValueMakeString(context.ref, string))
    }
    
    func valueOf<Wrapped>(value: Optional<Wrapped>, @noescape wrapped:(Wrapped) -> JSValue) -> JSValue {
        return value == nil ? JSValue(context, ref: JSValueMakeNull(context.ref)) : wrapped(value!)
    }
    
    func valueOf<Element>(value: Array<Element>, @noescape element:(Element) -> JSValue) -> JSValue {
        return JSValue(context, ref: context.invoke {
            JSObjectMakeArray(self.context.ref, value.count, value.map({ element($0).ref }), &$0)
        })
    }
    
    func valueOf(object: AnyObject) -> JSValue {
        return bindings.objectForKey(object) as! JSValue
    }
    
    func valueOf<T :AnyObject>(object: T, with eval :(JSContext) -> (JSValue)) -> JSValue {
        let value :JSValue? = bindings.objectForKey(object) as? JSValue
        return value ?? eval(context)
    }
    
    func valueOf(value :Any?) -> JSValue {
        switch value {
            case let bool as Bool:
                return self.valueOf(bool)
            case let double as Double:
                return self.valueOf(double)
            case let string as String:
                return self.valueOf(string)
            case nil:
                return JSValue(context, ref: JSValueMakeNull(context.ref))
            case let value as JSValue:
                return value
            case let object as AnyObject:
                return JSObject(context, wrap: object)
            default:
                fatalError()
        }
    }
    
}

protocol JSInstance : JSThis {
    func bind(object: AnyObject)
}

extension JSValue : JSInstance {
    func bind(object: AnyObject) {
        bindings.setObject(self, forKey: object)
    }
}

extension JSContext {
    var globalObject : JSInstance {
        get {
            return JSValue(self, ref: JSContextGetGlobalObject(self.ref))
        }
    }
    
    func eval(path :String) throws -> JSInstance {
        try eval(path) as Void;
        return globalObject
    }
}

protocol JSClass : JSThis {
    func construct(args :JSValue...) -> JSInstance
}

extension JSValue : JSClass {
    func construct(args :JSValue...) -> JSInstance {
        return JSValue(context, ref: context.invoke {
            JSObjectCallAsConstructor(self.context.ref, self.ref, args.count, args.map({ $0.ref}), &$0)
        })
    }
}

extension String {
    init(_ context: JSContext, ref: JSValueRef) {
        self = JSStringCopyCFString(nil, context.invoke {
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
        self = value.context.invoke {
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
    init(_ value: JSValue, wrapped:(JSValue) -> Wrapped) {
        self = JSValueIsNull(value.context.ref, value.ref) || JSValueIsUndefined(value.context.ref, value.ref) ? .None : wrapped(value)
    }
}

extension Array {
    init(_ value: JSValue, @noescape element:(JSValue) -> Element) {
        assert(JSValueIsArray(value.context.ref, value.ref), "Array expected but got \(JSValueGetType(value.context.ref, value.ref)): \(String(value.context, ref: value.ref))")
        self = [Element]()
        for index in 0..<UInt32(value[length]) {
            self.append(element(value[index]))
        }
    }
}
