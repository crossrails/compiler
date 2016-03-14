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

public let anyObjectInstance :Any = this[.anyObjectInstance] as JSValue

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
    this[.acceptSimpleInterface](this.valueOf(simpleInterface, with:simpleInterface.eval))
}

//functions

public var voidNoArgFunctionCalled :Bool {
    get {
        return Bool(this[.voidNoArgFunctionCalled])
    }
}

func voidNoArgFunction() {
    this[.voidNoArgFunction]()
}

func stringNoArgFunction() -> String {
    return String(this[.stringNoArgFunction]())
}

func numberMultipleArgFunction(a :Double, b :Double) -> Double {
    return Double(this[.numberMultipleArgFunction](this.valueOf(a), this.valueOf(b)))
}

public var stringNoArgLambda :() -> (String) {
    get {
        let function :JSFunction = this[.stringNoArgLambda]
        return { () in return String(function.call(this)) }
    }
    set {
        this[.stringNoArgLambda] = JSObject(this.context, callback: { args in return this.valueOf(newValue()) })
    }
}

//func throwSimpleError() throws {
//    global.callMember("throwSimpleError");
//}
//
//func throwSpecialError() throws {
//    try {
//        global.callMember("throwSpecialError");
//    } catch (NashornException e) {
//        throw new SpecialException((ScriptObjectMirror)e.getEcmaError());
//    }
//}

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

public let optionalAnyConst : Any? = this[.optionalAnyConst].infer()


//variables

public var booleanVar :Bool {
    get {
        return Bool(this[.booleanVar])
    }
    set {
        this[.booleanVar] = this.valueOf(newValue)
    }
}

public var numberVar :Double {
    get {
        return Double(this[.numberVar])
    }
    set {
        this[.numberVar] = this.valueOf(newValue)
    }
}

public var stringVar :String {
    get {
        return String(this[.stringVar])
    }
    set {
        this[.stringVar] = this.valueOf(newValue)
    }
}

public var anyVar :Any {
    get {
        return this[.anyVar].infer()
    }
    set {
        this[.anyVar] = this.valueOf(newValue)
    }
}

public var numberArrayVar :[Double] {
    get {
        return [Double](this[.numberArrayVar], element: Double.init)
    }
    set {
        this[.numberArrayVar] = this.valueOf(newValue, element: { this.valueOf($0) })
    }
}

public var stringArrayArrayVar :[[String]] {
    get {
        return [[String]](this[.stringArrayArrayVar], element: { [String]($0, element: String.init) })
    }
    set {
        this[.stringArrayArrayVar] = this.valueOf(newValue, element: { this.valueOf($0, element: { this.valueOf($0)})})
    }
}

//nullable variables

public var optionalBooleanVar :Bool? {
    get {
        return Bool?(this[.optionalBooleanVar], wrapped: Bool.init)
    }
    set {
        this[.optionalBooleanVar] = this.valueOf(newValue, wrapped: { this.valueOf($0) })
    }
}

public var optionalNumberVar :Double? {
    get {
        return Double?(this[.optionalNumberVar], wrapped: Double.init)
    }
    set {
        this[.optionalNumberVar] = this.valueOf(newValue, wrapped: { this.valueOf($0) })
    }
}

public var optionalStringVar :String? {
    get {
        return String?(this[.optionalStringVar], wrapped: String.init)
    }
    set {
        this[.optionalStringVar] = this.valueOf(newValue, wrapped: { this.valueOf($0) })
    }
}

public var optionalAnyVar :Any? {
    get {
        return this[.optionalAnyVar].infer()
    }
    set {
        this[.optionalAnyVar] = this.valueOf(newValue)
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
}
