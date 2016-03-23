//
//  simpleObject.swift
//  swift
//
//  Created by Nick Bransby-Williams on 12/03/2016.
//
//

import Foundation

public class SimpleObject : Equatable {
    
    private static var this :JSClass {
        get { return src.this["SimpleObject"] }
    }
    
    private let this :JSInstance;
    private var proxy :JSInstance!;

    public init(_ v :Double) {
        self.this = try! SimpleObject.this.construct(SimpleObject.this.valueOf(v))
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
    
    deinit {
        this.unbind(self)
    }
    
    public static func staticVoidNoArgMethod() {
        try! this[.staticVoidNoArgMethod]();
    }
    
    public func numberSingleObjectArgMethod(a :SimpleObject) -> Double {
        return Double(try! this[.numberSingleObjectArgMethod](this.valueOf(a)))
    }
    
    public func upcastThisToObject() -> Any {
        return try! this[.upcastThisToObject]().infer();
    }

    public func callOverriddenMethod() {
        try! this[.callOverriddenMethod].call(proxy)
    }
    
    public func methodToOverride() {
        try! this[.methodToOverride].call(proxy)
    }

    public var methodToOverrideCalled :Bool {
        get { return Bool(proxy[.methodToOverrideCalled]) }
    }
}

public func ==(lhs: SimpleObject, rhs: SimpleObject) -> Bool {
    return lhs as AnyObject == rhs as AnyObject
}
