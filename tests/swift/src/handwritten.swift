//
//  src.swift
//  swift
//
//  Created by Nick Bransby-Williams on 07/02/2016.
//
//

import Foundation

//objects

public let simpleObjectInstance = SimpleObject(this[.simpleObjectInstance])

public let anyObjectInstance :Any = this[.anyObjectInstance].infer()

public var optionalAnyObjectInstance :Any? {
    get {
        return Any?(this[.optionalAnyObjectInstance], wrapped: { $0.infer() })
    }
    set {
        this[.anyObjectInstance] =  this.valueOf(newValue, wrapped: this.valueOf)
    }
}

public var simpleInterfaceInstanceCalled :Bool {
    get {
        return Bool(this[.simpleInterfaceInstanceCalled])
    }
}

public var simpleInterfaceInstance :SimpleInterface {
    get {
        return JS_SimpleInterface(this[.simpleInterfaceInstance])
    }
}

public func acceptSimpleInterface(simpleInterface :SimpleInterface) {
    try! this[.acceptSimpleInterface](this.valueOf(simpleInterface, with:simpleInterface.eval))
}

//functions

public var voidNoArgFunctionCalled :Bool {
    get {
        return Bool(this[.voidNoArgFunctionCalled])
    }
}

func voidNoArgFunction() {
    try! this[.voidNoArgFunction]()
}

func stringNoArgFunction() -> String {
    return String(try! this[.stringNoArgFunction]())
}

func numberMultipleArgFunction(a :Double, b :Double) -> Double {
    return Double(try! this[.numberMultipleArgFunction](this.valueOf(a), this.valueOf(b)))
}

public var stringNoArgLambda :() -> (String) {
    get {
        let function :JSFunction = this[.stringNoArgLambda]
        return { () in return String(try! function.call(this)) }
    }
    set {
        this[.stringNoArgLambda] =  JSObject(this.context, callback: { args in return this.valueOf(newValue()) })
    }
}

func throwSimpleError() throws {
    try this[.throwSimpleError]();
}

func throwSpecialError() throws {
    do {
        try this[.throwSpecialError]();
    } catch let error as Error {
        throw SpecialException(error.exception)
    }
}


extension JSProperty {
    static let voidNoArgFunctionCalled : JSProperty = "voidNoArgFunctionCalled"
    static let voidNoArgFunction : JSProperty = "voidNoArgFunction"
    static let stringNoArgFunction : JSProperty = "stringNoArgFunction"
    static let numberMultipleArgFunction : JSProperty = "numberMultipleArgFunction"
    static let stringNoArgLambda : JSProperty = "stringNoArgLambda"
    static let SimpleObject : JSProperty = "SimpleObject"
    static let staticVoidNoArgMethod : JSProperty = "staticVoidNoArgMethod"
    static let simpleObjectInstance : JSProperty = "simpleObjectInstance"
    static let anyObjectInstance : JSProperty = "anyObjectInstance"
    static let simpleInterfaceInstanceCalled : JSProperty = "simpleInterfaceInstanceCalled"
    static let numberSingleObjectArgMethod : JSProperty = "numberSingleObjectArgMethod"
    static let upcastThisToObject : JSProperty = "upcastThisToObject"
    static let simpleInterfaceInstance : JSProperty = "simpleInterfaceInstance"
    static let acceptSimpleInterface : JSProperty = "acceptSimpleInterface"
    static let voidNoArgMethod : JSProperty = "voidNoArgMethod"
    static let callOverriddenMethod : JSProperty = "callOverriddenMethod"
    static let methodToOverrideCalled : JSProperty = "methodToOverrideCalled"
    static let methodToOverride : JSProperty = "methodToOverride"
    static let throwSimpleError : JSProperty = "throwSimpleError"
    static let throwSpecialError : JSProperty = "throwSpecialError"
    static let message : JSProperty = "message"
    static let optionalAnyObjectInstance : JSProperty = "optionalAnyObjectInstance"
    
}
