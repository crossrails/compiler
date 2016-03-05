//
//  object.swift
//  swift
//
//  Created by Nick Bransby-Williams on 14/02/2016.
//
//

import Foundation
import JavaScriptCore

public protocol Object {
    init(_ reference: Reference)
    var reference : Reference { get }
}

extension Reference : Value {
    public init(_ value: JSValueRef, context :Context) {
        assert(JSValueIsObject(context.ref, value), "\(kJSTypeObject) expected but got \(JSValueGetType(context.ref, value)): \(String(convert: value, context: context))")
        self.context = context
        self.object = context.invoke {
            JSValueToObject(context.ref, value, &$0)
        }
    }
    public func evaluate(context: Context) -> JSValueRef {
        assert(context.ref == self.context.ref)
        return object
    }
    
}

public struct Reference : CustomStringConvertible {
    
    internal let object :JSObjectRef
    internal let context :Context
    
    public init(globalObjectOfContext context :Context) {
        self.context = context
        self.object = JSContextGetGlobalObject(context.ref)
    }
    
    public var description: String {
        return String(convert: object, context: context)
    }
    
    //TODO deprecate once swift supports generic subscripts
    public func get<V: Value>(property: Property) -> V {
        let value = context.invoke {
            JSObjectGetProperty(self.context.ref, self.object, property.ref, &$0)
        }
        return V(value, context: context)
    }
    //TODO deprecate once swift supports generic subscripts
    public func set<V : Value>(property: Property, newValue: V) {
        context.invoke {
            JSObjectSetProperty(self.context.ref, self.object, property.ref, newValue.evaluate(self.context), UInt32(kJSPropertyAttributeNone), &$0)
        }
    }


    //TODO deprecate once swift supports generic subscripts
    public func get<V : Value>(property: Property) -> V? {
        let value = context.invoke {
            JSObjectGetProperty(self.context.ref, self.object, property.ref, &$0)
        }
        return Optional(value, context: context)
    }
    //TODO deprecate once swift supports generic subscripts
    public func set<V : Value>(property: Property, newValue: V?) {
        context.invoke {
            JSObjectSetProperty(self.context.ref, self.object, property.ref, newValue.evaluate(self.context), UInt32(kJSPropertyAttributeNone), &$0)
        }
    }
    
    public func get<V : Value>(property: Property) -> Array<V> {
        let value = context.invoke {
            JSObjectGetProperty(self.context.ref, self.object, property.ref, &$0)
        }
        return Array(value, context: context)
    }
    //TODO deprecate once swift supports generic subscripts
    public func set<V : Value>(property: Property, newValue: Array<V>) {
        context.invoke {
            JSObjectSetProperty(self.context.ref, self.object, property.ref, newValue.evaluate(self.context), UInt32(kJSPropertyAttributeNone), &$0)
        }
    }

    //TODO deprecate once swift supports generic subscripts
    public func get<O: Object>(property: Property) -> O {
        return O(get(property))
    }
    //TODO deprecate once swift supports generic subscripts
    public func set<O : Object>(property: Property, newValue: O) {
        context.invoke {
            JSObjectSetProperty(self.context.ref, self.object, property.ref, newValue.reference.evaluate(self.context), UInt32(kJSPropertyAttributeNone), &$0)
        }
    }    
}