//
//  object.swift
//  swift
//
//  Created by Nick Bransby-Williams on 14/02/2016.
//
//

import Foundation
import JavaScriptCore

public protocol Subject {
    init(_ proxy: Proxy)
    var proxy : Proxy { get }
}

public struct Proxy : Value, CustomStringConvertible {
    
    internal let object :JSObjectRef
    internal let context :Context
    
    public init(globalObjectOfContext context :Context) {
        self.context = context
        self.object = JSContextGetGlobalObject(context.ref)
    }
    
    public init(_ value: JSValueRef, context :Context) {
        assert(JSValueIsObject(context.ref, value), "\(kJSTypeObject) expected but got \(JSValueGetType(context.ref, value)): \(String(convert: value, context: context))")
        self.context = context
        self.object = context.invoke {
            JSValueToObject(context.ref, value, &$0)
        }
    }
    
    public var description: String {
        return String(convert: object, context: context)
    }
    
    static func devaluate<V : Value>(value: JSValueRef, context: Context) -> V {
        return self.init(value, context: context) as! V
    }
    
    internal func valuate(context: Context) -> JSValueRef {
        assert(context.ref == self.context.ref)
        return object
    }
    
    //TODO deprecate once swift supports generic subscripts
    private func get<V: Value>(property: Property) -> V {
        let value = context.invoke {
            JSObjectGetProperty(self.context.ref, self.object, property.ref, &$0)
        }
        return V.devaluate(value, context: context)
    }
    
    private subscript(property: Property) -> Value {
        get {
            fatalError("Use the get method until swift supports generic subscripts")
        }
        set(newValue) {
            context.invoke {
                JSObjectSetProperty(self.context.ref, self.object, property.ref, newValue.valuate(self.context), UInt32(kJSPropertyAttributeNone), &$0)
            }
        }
    }
    
    //TODO deprecate once swift supports generic subscripts
    public func get<T: Subject>(property: Property) -> T {
        return T(get(property) as Proxy)
    }
    
    public subscript(property: Property) -> Subject {
        get {
            fatalError("Use the get method until swift supports generic subscripts")
        }
        set(newValue) {
            self[property] = newValue.proxy
        }
    }

    public subscript(property: Property) -> Double {
        get {
            return get(property)
        }
        set(newValue) {
            self[property] = newValue as Value
        }
    }
    
    public subscript(property: Property) -> Bool {
        get {
            return get(property)
        }
        set(newValue) {
            self[property] = newValue as Value
        }
    }
    
    public subscript(property: Property) -> String {
        get {
            return get(property)
        }
        set(newValue) {
            self[property] = newValue as Value
        }
    }

    public subscript(property: Property) -> Optional<String> {
        get {
            return get(property)
        }
        set(newValue) {
            self[property] = newValue as Value
        }
    }
}