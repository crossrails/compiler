//
//  src.swift
//  swift
//
//  Created by Nick Bransby-Williams on 07/02/2016.
//
//

import Foundation

var this :JSInstance = try! JSContext().eval(NSBundle(identifier: "io.xrails.src")!.pathForResource("src", ofType: "js")!)

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

///constants

public let booleanConst = Bool(this[.booleanConst])

public let numberConst = Double(this[.numberConst])

public let stringConst = String(this[.stringConst])

public let numberArrayConst = [Double](this[.numberArrayConst], element: Double.init)

public let stringArrayArrayConst = [[String]](this[.stringArrayArrayConst], element: { [String]($0, element: String.init) })

public let anyConst : Any = this[.anyConst].infer()


//nullable constants

public let optionalBooleanConst = Bool?(this[.optionalBooleanConst], wrapped: Bool.init)

public let optionalNumberConst = Double?(this[.optionalNumberConst], wrapped: Double.init)

public let optionalStringConst = String?(this[.optionalStringConst], wrapped: String.init)

public let optionalNumberArrayConst :[Double]? = [Double]?(this[.optionalNumberConst], wrapped: { [Double]($0, element: Double.init) })

public let optionalAnyConst =  Any?(this[.optionalAnyConst], wrapped: JSValue.infer)


//variables

public var booleanVar :Bool {
    get {
        return Bool(this[.booleanVar])
    }
    set {
        this[.booleanVar] =  this.valueOf(newValue)
    }
}

public var numberVar :Double {
    get {
        return Double(this[.numberVar])
    }
    set {
        this[.numberVar] =  this.valueOf(newValue)
    }
}

public var stringVar :String {
    get {
        return String(this[.stringVar])
    }
    set {
        this[.stringVar] =  this.valueOf(newValue)
    }
}

public var anyVar :Any {
    get {
        return this[.anyVar].infer()
    }
    set {
        this[.anyVar] =  this.valueOf(newValue)
    }
}

public var numberArrayVar :[Double] {
    get {
        return [Double](this[.numberArrayVar], element: Double.init)
    }
    set {
        this[.numberArrayVar] =  this.valueOf(newValue, element: this.valueOf)
    }
}

public var stringArrayArrayVar :[[String]] {
    get {
        return [[String]](this[.stringArrayArrayVar], element: { [String]($0, element: String.init) })
    }
    set {
        this[.stringArrayArrayVar] =  this.valueOf(newValue, element: { this.valueOf($0, element: this.valueOf)})
    }
}

//nullable variables

public var optionalBooleanVar :Bool? {
    get {
        return Bool?(this[.optionalBooleanVar], wrapped: Bool.init)
    }
    set {
        this[.optionalBooleanVar] =  this.valueOf(newValue, wrapped: this.valueOf)
    }
}

public var optionalNumberVar :Double? {
    get {
        return Double?(this[.optionalNumberVar], wrapped: Double.init)
    }
    set {
        this[.optionalNumberVar] =  this.valueOf(newValue, wrapped: this.valueOf)
    }
}

public var optionalStringVar :String? {
    get {
        return String?(this[.optionalStringVar], wrapped: String.init)
    }
    set {
        this[.optionalStringVar] =  this.valueOf(newValue, wrapped: this.valueOf)
    }
}

public var optionalAnyVar :Any? {
    get {
        return Any?(this[.optionalAnyVar], wrapped: { $0.infer() })
    }
    set {
        this[.optionalAnyVar] = this.valueOf(newValue, wrapped: this.valueOf)
    }
}

extension JSProperty {
    static let booleanConst : JSProperty = "booleanConst"
    static let numberConst : JSProperty = "numberConst"
    static let stringConst : JSProperty = "stringConst"
    static let numberArrayConst : JSProperty = "numberArrayConst"
    static let stringArrayArrayConst : JSProperty = "stringArrayArrayConst"
    static let anyConst : JSProperty = "anyConst"
    static let optionalBooleanConst : JSProperty = "optionalBooleanConst"
    static let optionalNumberConst : JSProperty = "optionalNumberConst"
    static let optionalStringConst : JSProperty = "optionalStringConst"
    static let optionalNumberArrayConst : JSProperty = "optionalNumberArrayConst"
    static let optionalAnyConst : JSProperty = "optionalAnyConst"
    static let booleanVar : JSProperty = "booleanVar"
    static let numberVar : JSProperty = "numberVar"
    static let stringVar : JSProperty = "stringVar"
    static let numberArrayVar : JSProperty = "numberArrayVar"
    static let stringArrayArrayVar : JSProperty = "stringArrayArrayVar"
    static let anyVar : JSProperty = "anyVar"
    static let optionalBooleanVar : JSProperty = "optionalBooleanVar"
    static let optionalNumberVar : JSProperty = "optionalNumberVar"
    static let optionalStringVar : JSProperty = "optionalStringVar"
    static let optionalAnyVar : JSProperty = "optionalAnyVar"
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
