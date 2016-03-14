//
//  simpleObject.swift
//  swift
//
//  Created by Nick Bransby-Williams on 12/03/2016.
//
//

import Foundation

public class SimpleObject : Equatable {
    
    private static let this :JSClass = src.this["SimpleObject"]
    
    private let this :JSInstance;
    private var proxy :JSInstance!;

    public init(_ v :Double) {
        self.this = SimpleObject.this.construct(SimpleObject.this.valueOf(v))
        self.proxy = self.dynamicType === SimpleObject.self ? this : JSObject(this.context, prototype: this, callbacks: [
            "methodToOverride": { args in
                self.methodToOverride()
                return nil
            }
        ])
        this.bind(self)
    }
    
    init(_ instance :JSInstance) {
        this = instance
        proxy = instance;
        this.bind(self)
    }
    
    public static func staticVoidNoArgMethod() {
        this[.staticVoidNoArgMethod]();
    }
    
    public func numberSingleObjectArgMethod(a :SimpleObject) -> Double {
        return Double(this[.numberSingleObjectArgMethod](this.valueOf(a)))
    }
    
    public func upcastThisToObject() -> Any {
        return this[.upcastThisToObject]();
    }

    public func callOverriddenMethod() {
        this[.callOverriddenMethod].call(proxy)
    }
    
    public func methodToOverride() {
        this[.methodToOverride].call(proxy)
    }

    public var methodToOverrideCalled :Bool {
        get { return Bool(proxy[.methodToOverrideCalled]) }
    }
}

public func ==(lhs: SimpleObject, rhs: SimpleObject) -> Bool {
    return lhs as Any == rhs as Any
}
