//
//  js.swift
//  swift
//
//  Created by Nick Bransby-Williams on 11/03/2016.
//
//

import Foundation
import JavaScriptCore

struct JS {
    struct Context {
        
        let ref :JSContextRef
        
        init(_ path :String) throws {
            ref = JSGlobalContextCreate(nil)
            let string = JSStringCreateWithCFString(try NSString(contentsOfFile: path, encoding: NSUTF8StringEncoding) as String)
            let url = JSStringCreateWithCFString(path)
            defer {
                JSStringRelease(url)
                JSStringRelease(string)
            }
//            self.invoke {
//                JSEvaluateScript(self.ref, string, nil, url, 0, &$0)
//            }
            //workaround for complier seg fault
            var exception :JSValueRef = nil
            JSEvaluateScript(self.ref, string, nil, url, 0, &exception)
            if exception != nil {
                preconditionFailure("Exception thrown: \(String(convert: exception, context: self))")
            }
        }
        
        func invoke<T>(f: (inout exception :JSValueRef ) -> T) -> T {
            var exception :JSValueRef = nil
            let result = f(exception: &exception)
            if exception != nil {
                preconditionFailure("Exception thrown: \(String(convert: exception, context: self))")
            }
            return result
        }
        
    }
    
    struct Property : CustomStringConvertible, StringLiteralConvertible {
        
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
    
    struct Object : CustomStringConvertible {
        
        let ref :JSObjectRef
        let context :Context
        
        init(_ ref :JSObjectRef, context :Context) {
            self.ref = ref
            self.context = context
        }
        
        var description: String {
            return String(convert: ref, context: context)
        }
        
        subscript(property: Property) -> Value {
            get {
                let value = context.invoke {
                    JSObjectGetProperty(self.context.ref, self.ref, property.ref, &$0)
                }
                return Value(value, context: context)
            }
            set(newValue) {
                context.invoke {
                    JSObjectSetProperty(self.context.ref, self.ref, property.ref, newValue.ref, UInt32(kJSPropertyAttributeNone), &$0)
                }
            }
        }
        
        subscript(index: UInt32) -> Value {
            get {
                let value = context.invoke {
                    JSObjectGetPropertyAtIndex(self.context.ref, self.ref, index, &$0)
                }
                return Value(value, context: context)
            }
            set(newValue) {
                context.invoke {
                    JSObjectSetPropertyAtIndex(self.context.ref, self.ref, index, newValue.ref, &$0)
                }
            }
        }
    }
    
    struct Value : CustomStringConvertible {
        
        let ref :JSValueRef
        let context :Context
        
        init(_ ref :JSValueRef, context :Context) {
            self.ref = ref
            self.context = context
        }
        
        var description: String {
            return String(convert: ref, context: context)
        }
        
    }
}

extension JS.Context {
    var globalObject : JS.Object {
        get {
            return JS.Object(JSContextGetGlobalObject(self.ref), context: self)
        }
    }
}

extension String {
    init(convert value: JSValueRef, context: JS.Context) {
        self = JSStringCopyCFString(nil, context.invoke {
            JSValueToStringCopy(context.ref, value, &$0)
        }) as String
    }
}

extension Bool {
    init(_ value: JS.Value) {
        assert(JSValueIsBoolean(value.context.ref, value.ref), "\(kJSTypeBoolean) expected but got \(JSValueGetType(value.context.ref, value.ref)): \(String(convert: value.ref, context: value.context))")
        self = JSValueToBoolean(value.context.ref, value.ref)
    }
    
    func eval(context: JS.Context) -> JS.Value {
        return JS.Value(JSValueMakeBoolean(context.ref, self), context: context)
    }
}

extension Double {
    init(_ value: JS.Value) {
        assert(JSValueIsNumber(value.context.ref, value.ref), "\(kJSTypeNumber) expected but got \(JSValueGetType(value.context.ref, value.ref)): \(String(convert: value.ref, context: value.context))")
        self = value.context.invoke {
            JSValueToNumber(value.context.ref, value.ref, &$0)
        }
    }
    
    func eval(context: JS.Context) -> JS.Value {
        return JS.Value(JSValueMakeNumber(context.ref, self), context: context)
    }
}

extension UInt32 {
    init(_ value: JS.Value) {
        self = UInt32(Double(value))
    }
    
    func eval(context: JS.Context) -> JS.Value {
        return Double(self).eval(context)
    }
}

extension String {
    init(_ value: JS.Value) {
        assert(JSValueIsString(value.context.ref, value.ref), "\(kJSTypeString) expected but got \(JSValueGetType(value.context.ref, value.ref)): \(String(convert: value.ref, context: value.context))")
        self.init(convert: value.ref, context: value.context)
    }
    
    func eval(context: JS.Context) -> JS.Value {
        let string = JSStringCreateWithUTF8CString(self)
        defer {
            JSStringRelease(string)
        }
        return JS.Value(JSValueMakeString(context.ref, string), context: context)
    }
}

let length : JS.Property = "length"

extension Array {
    init(_ value: JS.Value, element:(JS.Value) -> Element) {
        assert(JSValueIsArray(value.context.ref, value.ref), "Array expected but got \(JSValueGetType(value.context.ref, value.ref)): \(String(convert: value.ref, context: value.context))")
        let array = JS.Object(value.ref, context: value.context)
        self = [Element]()
        for index in 0...UInt32(array[length])-1 {
            self.append(element(array[index]))
        }
    }
    
    func eval(context: JS.Context, element:(Element) -> JS.Value) -> JS.Value {
        let value : JSValueRef = context.invoke {
            var v = element(self[0]).ref
            return JSObjectMakeArray(context.ref, 1, &v, &$0)
        }
        return JS.Value(value, context: context)
    }
}

extension Optional {
    init(_ value: JS.Value, wrapped:(JS.Value) -> Wrapped) {
        self = JSValueIsNull(value.context.ref, value.ref) || JSValueIsUndefined(value.context.ref, value.ref) ? .None : wrapped(value)
    }
    
    func eval(context: JS.Context, wrapped:(Wrapped) -> JS.Value) -> JS.Value {
        return self == nil ? JS.Value(JSValueMakeNull(context.ref), context: context) : wrapped(self!)
    }
}
