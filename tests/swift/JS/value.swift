//
//  value.swift
//  swift
//
//  Created by Nick Bransby-Williams on 14/02/2016.
//
//

import Foundation
import JavaScriptCore

internal protocol Value {
    static func devaluate<V : Value>(value: JSValueRef, context: Context) -> V
    func valuate(context: Context) -> JSValueRef
}

extension JSType : CustomStringConvertible {
    public var description: String {
        switch self {
        case kJSTypeNull:
            return "Null"
        case kJSTypeNumber:
            return "NUmber"
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

extension Optional : Value {
    static func devaluate<V : Value>(value: JSValueRef, context: Context) -> V {
        let type :Value.Type = Wrapped.self as! Value.Type
        print(V.self)
        return JSValueIsNull(context.ref, value) || JSValueIsUndefined(context.ref, value) ? Optional<String>.None as! V : type.devaluate(value, context: context)
    }
    
    func valuate(context: Context) -> JSValueRef {
        switch(self) {
        case .Some(let value as Value):
            return value.valuate(context)
        case .None:
            return JSValueMakeNull(context.ref)
        default:
            assertionFailure("Unknown optional type")
            return JSValueMakeUndefined(context.ref)
            
        }
    }
}

extension Bool :Value {
    init(_ value: JSValueRef, context: Context) {
        assert(JSValueIsBoolean(context.ref, value), "\(kJSTypeBoolean) expected but got \(JSValueGetType(context.ref, value)): \(String(convert: value, context: context))")
        self = JSValueToBoolean(context.ref, value)
    }
    
    func valuate(context: Context) -> JSValueRef {
        return JSValueMakeBoolean(context.ref, self)
    }
    
    static func devaluate<V : Value>(value: JSValueRef, context: Context) -> V {
        return self.init(value, context: context) as! V
    }
}

extension Double :Value {
    init(_ value: JSValueRef, context: Context) {
        assert(JSValueIsNumber(context.ref, value), "\(kJSTypeNumber) expected but got \(JSValueGetType(context.ref, value)): \(String(convert: value, context: context))")
        self = context.invoke {
            JSValueToNumber(context.ref, value, &$0)
        }
    }
    
    func valuate(context: Context) -> JSValueRef {
        return JSValueMakeNumber(context.ref, self)
    }
    
    static func devaluate<V : Value>(value: JSValueRef, context: Context) -> V {
        return self.init(value, context: context) as! V
    }
}

extension String :Value {
    init(convert value: JSValueRef, context: Context) {
        self = JSStringCopyCFString(nil, context.invoke {
            JSValueToStringCopy(context.ref, value, &$0)
        }) as String
    }
    
    init(_ value: JSValueRef, context: Context) {
        assert(JSValueIsString(context.ref, value), "\(kJSTypeString) expected but got \(JSValueGetType(context.ref, value)): \(String(convert: value, context: context))")
        self.init(convert: value, context: context)
    }
    
    func valuate(context: Context) -> JSValueRef {
        let string = JSStringCreateWithUTF8CString(self)
        defer {
            JSStringRelease(string)
        }
        return JSValueMakeString(context.ref, string)
    }
    
    static func devaluate<V : Value>(value: JSValueRef, context: Context) -> V {
        return self.init(value, context: context) as! V
    }
}

