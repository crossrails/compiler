//
//  js.swift
//  swift
//
//  Created by Nick Bransby-Williams on 08/03/2016.
//
//

import Foundation
import JavaScriptCore

struct Context {
    
    let ref :JSContextRef
    
    private init(classRef :JSClassRef) {
        ref = JSGlobalContextCreate(classRef)
    }
    
    init() {
        self.init(classRef: COpaquePointer(nilLiteral: ()))
    }
    
    func invoke<T>(f: (inout exception :JSValueRef ) -> T) -> T {
        var exception :JSValueRef = nil
        let result = f(exception: &exception)
        if exception != nil {
            preconditionFailure("Exception thrown: \(String(convert: exception, context: self))")
        }
        return result
    }
    
    //    init(globalObjectClass: Class) {
    //        self.init(classRef: globalObjectClass.ref)
    //    }
    
    func evaluateScript(script :String, sourceUrl :String) {
        let string = JSStringCreateWithCFString(script)
        let url = JSStringCreateWithCFString(sourceUrl)
        defer {
            JSStringRelease(url)
            JSStringRelease(string)
        }
        self.invoke {
            JSEvaluateScript(self.ref, string, nil, url, 0, &$0)
        }
    }
    
    func evaluateScript(path :String) throws {
        self.evaluateScript(try NSString(contentsOfFile: path, encoding: NSUTF8StringEncoding) as String, sourceUrl:path)
    }
    
}

protocol JavaScriptObject {
    static var javaScriptClass :Class { get }
}

struct Class {
    
    let ref :JSClassRef
    
    init() {
        ref = nil
        //    var definition :JSClassDefinition = kJSClassDefinitionEmpty
        //    let proxy = JSClassCreate(&definition)
        //    JSClassRelease(proxy)
    }
    
}

protocol Object {
    init(_ reference: Reference)
    var reference : Reference { get }
}

extension Reference : Value {
    init(_ value: JSValueRef, context :Context) {
        assert(JSValueIsObject(context.ref, value), "\(kJSTypeObject) expected but got \(JSValueGetType(context.ref, value)): \(String(convert: value, context: context))")
        self.context = context
        self.object = context.invoke {
            JSValueToObject(context.ref, value, &$0)
        }
    }
    func evaluate(context: Context) -> JSValueRef {
        assert(context.ref == self.context.ref)
        return object
    }
    
}

//TODO replace get/set once swift supports generic subscripts
struct Reference : CustomStringConvertible {
    
    let object :JSObjectRef
    let context :Context
    
    init(globalObjectOfContext context :Context) {
        self.context = context
        self.object = JSContextGetGlobalObject(context.ref)
    }
    
    var description: String {
        return String(convert: object, context: context)
    }
    
    
    subscript(property: Property) -> JSValueRef {
        get {
            return property.get(self)
        }
        set(newValue) {
            property.set(self, newValue: newValue)
        }
    }
    
    subscript(property: Property) -> Bool {
        get {
            return Bool(property.get(self), context: self.context)
        }
        set(newValue) {
            property.set(self, newValue: newValue.evaluate(self.context))
        }
    }
    
    subscript(property: Property) -> Double {
        get {
            return Double(property.get(self), context: self.context)
        }
        set(newValue) {
            property.set(self, newValue: newValue.evaluate(self.context))
        }
    }
    
    subscript(property: Property) -> String {
        get {
            return String(property.get(self), context: self.context)
        }
        set(newValue) {
            property.set(self, newValue: newValue.evaluate(self.context))
        }
    }
    
    subscript(property: Property) -> Bool? {
        get {
            return Optional(property.get(self), context: self.context)
        }
        set(newValue) {
            property.set(self, newValue: newValue.evaluate(self.context))
        }
    }
    
    subscript(property: Property) -> Double? {
        get {
            return Optional(property.get(self), context: self.context)
        }
        set(newValue) {
            property.set(self, newValue: newValue.evaluate(self.context))
        }
    }
    
    subscript(property: Property) -> String? {
        get {
            return Optional(property.get(self), context: self.context)
        }
        set(newValue) {
            property.set(self, newValue: newValue.evaluate(self.context))
        }
    }
    
    
    
//    //arrays
//    
//    func get<V : Value>(property: Property) -> Array<V> {
//        let value = context.invoke {
//            JSObjectGetProperty(self.context.ref, self.object, property.ref, &$0)
//        }
//        return Array(value, context: context)
//    }
//    func set<V : Value>(property: Property, newValue: Array<V>) {
//        context.invoke {
//            JSObjectSetProperty(self.context.ref, self.object, property.ref, newValue.evaluate(self.context), UInt32(kJSPropertyAttributeNone), &$0)
//        }
//    }
    
    //TODO deprecate once swift supports generic subscripts
    //    func get<V : Value>(property: Property) -> Array<V>? {
    //        let value = context.invoke {
    //            JSObjectGetProperty(self.context.ref, self.object, property.ref, &$0)
    //        }
    //        return Optional(value, context: context)
    //    }
    //    //TODO deprecate once swift supports generic subscripts
    //    func set<V : Value>(property: Property, newValue: Array<V>?) {
    //        context.invoke {
    //            JSObjectSetProperty(self.context.ref, self.object, property.ref, newValue.evaluate(self.context), UInt32(kJSPropertyAttributeNone), &$0)
    //        }
    //    }
    
//    //TODO deprecate once swift supports generic subscripts
//    func get<O: Object>(property: Property) -> O {
//        return O(get(property))
//    }
//    //TODO deprecate once swift supports generic subscripts
//    func set<O : Object>(property: Property, newValue: O) {
//        context.invoke {
//            JSObjectSetProperty(self.context.ref, self.object, property.ref, newValue.reference.evaluate(self.context), UInt32(kJSPropertyAttributeNone), &$0)
//        }
//    }    
}

protocol PropertyType {
    func get(reference: Reference) -> JSValueRef
    func set(reference: Reference, newValue :JSValueRef)
}

extension UInt32 : PropertyType {
    
    func get(reference: Reference) -> JSValueRef {
        return reference.context.invoke {
            JSObjectGetPropertyAtIndex(reference.context.ref, reference.object, self, &$0)
        }
    }
    
    func set(reference: Reference, newValue :JSValueRef) {
        reference.context.invoke {
            JSObjectSetPropertyAtIndex(reference.context.ref, reference.object, self, newValue, &$0)
        }
    }
}

struct Property : PropertyType, CustomStringConvertible, StringLiteralConvertible {
    
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
    
    func get(reference: Reference) -> JSValueRef {
        return reference.context.invoke {
            JSObjectGetProperty(reference.context.ref, reference.object, self.ref, &$0)
        }
    }
    
    func set(reference: Reference, newValue :JSValueRef) {
        reference.context.invoke {
            JSObjectSetProperty(reference.context.ref, reference.object, self.ref, newValue, UInt32(kJSPropertyAttributeNone), &$0)
        }
    }
}

protocol Value {
    init(_ value :JSValueRef, context :Context)
    func evaluate(context :Context) -> JSValueRef
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

extension Bool : Value {
    init(_ value: JSValueRef, context: Context) {
        assert(JSValueIsBoolean(context.ref, value), "\(kJSTypeBoolean) expected but got \(JSValueGetType(context.ref, value)): \(String(convert: value, context: context))")
        self = JSValueToBoolean(context.ref, value)
    }
    
    func evaluate(context: Context) -> JSValueRef {
        return JSValueMakeBoolean(context.ref, self)
    }
}

extension Double : Value {
    init(_ value: JSValueRef, context: Context) {
        assert(JSValueIsNumber(context.ref, value), "\(kJSTypeNumber) expected but got \(JSValueGetType(context.ref, value)): \(String(convert: value, context: context))")
        self = context.invoke {
            JSValueToNumber(context.ref, value, &$0)
        }
    }
    
    func evaluate(context: Context) -> JSValueRef {
        return JSValueMakeNumber(context.ref, self)
    }
}

extension String : Value {
    init(convert value: JSValueRef, context: Context) {
        self = JSStringCopyCFString(nil, context.invoke {
            JSValueToStringCopy(context.ref, value, &$0)
            }) as String
    }
    
    init(_ value: JSValueRef, context: Context) {
        assert(JSValueIsString(context.ref, value), "\(kJSTypeString) expected but got \(JSValueGetType(context.ref, value)): \(String(convert: value, context: context))")
        self.init(convert: value, context: context)
    }
    
    func evaluate(context: Context) -> JSValueRef {
        let string = JSStringCreateWithUTF8CString(self)
        defer {
            JSStringRelease(string)
        }
        return JSValueMakeString(context.ref, string)
    }
}


protocol ValueContainer {
    typealias ValueType
    init(_ value :JSValueRef, context :Context, type :ValueType)
}

//extension Optional : ValueContainer {
//    typealias ValueType = Wrapped
//    init(_ value :JSValueRef, context :Context, type :ValueType) {
//        self = JSValueIsNull(context.ref, value) || JSValueIsUndefined(context.ref, value) ? .None : Wrapped(value, context: context)
//    }
//}

extension Optional where Wrapped: Value {
    init(_ value :JSValueRef, context :Context) {
        self = JSValueIsNull(context.ref, value) || JSValueIsUndefined(context.ref, value) ? .None : Wrapped(value, context: context)
    }
    func evaluate(context: Context) -> JSValueRef {
        let value = self?.evaluate(context)
        return value ?? JSValueMakeNull(context.ref)
    }
}

let length : Property = "length"

extension Array where Element: Value {
    
    init(_ value :JSValueRef, context :Context) {
        assert(JSValueIsArray(context.ref, value), "Array expected but got \(JSValueGetType(context.ref, value)): \(String(convert: value, context: context))")
        let count = context.invoke {
            JSValueToNumber(context.ref, JSObjectGetProperty(context.ref, value, length.ref, &$0), &$0)
        }
        self = [Element]()
        for index in 0...UInt32(count)-1 {
            let value = context.invoke {
                JSObjectGetPropertyAtIndex(context.ref, value, index, &$0)
            }
            self.append(Element(value, context: context))
        }
        
    }
    
    func evaluate(context: Context) -> JSValueRef {
        var values = [JSValueRef]()
        for element in self {
            values.append(element.evaluate(context))
        }
        return context.invoke {
            JSObjectMakeArray(context.ref, values.count, values, &$0)
        }
    }
}

extension Array {
    
    init(_ value :JSValueRef, context :Context) {
        assert(JSValueIsArray(context.ref, value), "Array expected but got \(JSValueGetType(context.ref, value)): \(String(convert: value, context: context))")
        let count = context.invoke {
            JSValueToNumber(context.ref, JSObjectGetProperty(context.ref, value, length.ref, &$0), &$0)
        }
        self = [Element]()
        for index in 0...UInt32(count)-1 {
            let value = context.invoke {
                JSObjectGetPropertyAtIndex(context.ref, value, index, &$0)
            }
            self.append(Element(value, context: context))
        }
        
    }
    
    func evaluate(context: Context) -> JSValueRef {
        var values = [JSValueRef]()
        for element in self {
            values.append(element.evaluate(context))
        }
        return context.invoke {
            JSObjectMakeArray(context.ref, values.count, values, &$0)
        }
    }
}

