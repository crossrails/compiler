//
//  value.swift
//  swift
//
//  Created by Nick Bransby-Williams on 14/02/2016.
//
//

import Foundation
import JavaScriptCore

public typealias AnyValue = Value

public protocol Value {
    init(_ value :JSValueRef, context :Context)
    func evaluate(context :Context) -> JSValueRef
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

extension Bool : Value {
    public init(_ value: JSValueRef, context: Context) {
        assert(JSValueIsBoolean(context.ref, value), "\(kJSTypeBoolean) expected but got \(JSValueGetType(context.ref, value)): \(String(convert: value, context: context))")
        self = JSValueToBoolean(context.ref, value)
    }
    
    public func evaluate(context: Context) -> JSValueRef {
        return JSValueMakeBoolean(context.ref, self)
    }
}

extension Double : Value {
    public init(_ value: JSValueRef, context: Context) {
        assert(JSValueIsNumber(context.ref, value), "\(kJSTypeNumber) expected but got \(JSValueGetType(context.ref, value)): \(String(convert: value, context: context))")
        self = context.invoke {
            JSValueToNumber(context.ref, value, &$0)
        }
    }
    
    public func evaluate(context: Context) -> JSValueRef {
        return JSValueMakeNumber(context.ref, self)
    }
}

extension String : Value {
    init(convert value: JSValueRef, context: Context) {
        self = JSStringCopyCFString(nil, context.invoke {
            JSValueToStringCopy(context.ref, value, &$0)
        }) as String
    }
    
    public init(_ value: JSValueRef, context: Context) {
        assert(JSValueIsString(context.ref, value), "\(kJSTypeString) expected but got \(JSValueGetType(context.ref, value)): \(String(convert: value, context: context))")
        self.init(convert: value, context: context)
    }
    
    public func evaluate(context: Context) -> JSValueRef {
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

extension Optional : ValueContainer {
    typealias ValueType = Wrapped
    init(_ value :JSValueRef, context :Context, type :ValueType) {
        self = JSValueIsNull(context.ref, value) || JSValueIsUndefined(context.ref, value) ? .None : Wrapped(value, context: context)
    }
}

extension Optional where Wrapped: Value {
    public init(_ value :JSValueRef, context :Context) {
        self = JSValueIsNull(context.ref, value) || JSValueIsUndefined(context.ref, value) ? .None : Wrapped(value, context: context)
    }
    func evaluate(context: Context) -> JSValueRef {
        let value = self?.evaluate(context)
        return value ?? JSValueMakeNull(context.ref)
    }
}

internal let length : Property = "length"

extension Array where Element: Value {
    
    public init(_ value :JSValueRef, context :Context) {
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
    
    public func evaluate(context: Context) -> JSValueRef {
        var values = [JSValueRef]()
        for element in self {
            values.append(element.evaluate(context))
        }
        return context.invoke {
            JSObjectMakeArray(context.ref, values.count, values, &$0)
        }
    }
}

