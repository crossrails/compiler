import Foundation

var this: JSInstance = try! JSContext().eval(Bundle(identifier: "io.xrails.src")!.path(forResource: "src", ofType: "js")!)


extension JSProperty {
    static let booleanConst: JSProperty = "booleanConst"
    static let numberConst: JSProperty = "numberConst"
    static let stringConst: JSProperty = "stringConst"
    static let numberOrNullArrayConst: JSProperty = "numberOrNullArrayConst"
    static let numberArrayConst: JSProperty = "numberArrayConst"
    static let stringArrayArrayConst: JSProperty = "stringArrayArrayConst"
    static let anyConst: JSProperty = "anyConst"
    static let optionalBooleanConst: JSProperty = "optionalBooleanConst"
    static let optionalNumberConst: JSProperty = "optionalNumberConst"
    static let optionalStringConst: JSProperty = "optionalStringConst"
    static let optionalNumberArrayConst: JSProperty = "optionalNumberArrayConst"
    static let optionalNullAnyConst: JSProperty = "optionalNullAnyConst"
    static let optionalNonNullAnyConst: JSProperty = "optionalNonNullAnyConst"
    static let booleanVar: JSProperty = "booleanVar"
    static let numberVar: JSProperty = "numberVar"
    static let stringVar: JSProperty = "stringVar"
    static let numberArrayVar: JSProperty = "numberArrayVar"
    static let anyVar: JSProperty = "anyVar"
    static let stringArrayArrayVar: JSProperty = "stringArrayArrayVar"
    static let optionalBooleanVar: JSProperty = "optionalBooleanVar"
    static let optionalNumberVar: JSProperty = "optionalNumberVar"
    static let optionalStringVar: JSProperty = "optionalStringVar"
    static let optionalNumberArrayVar: JSProperty = "optionalNumberArrayVar"
    static let optionalAnyVar: JSProperty = "optionalAnyVar"
    static let voidNoArgFunctionCalled: JSProperty = "voidNoArgFunctionCalled"
    static let voidNoArgFunction: JSProperty = "voidNoArgFunction"
    static let stringNoArgFunction: JSProperty = "stringNoArgFunction"
    static let numberMultipleArgFunction: JSProperty = "numberMultipleArgFunction"
    static let stringNoArgLambda: JSProperty = "stringNoArgLambda"
    static let throwSimpleError: JSProperty = "throwSimpleError"
    static let SpecialError: JSProperty = "SpecialError"
    static let message: JSProperty = "message"
    static let throwSpecialError: JSProperty = "throwSpecialError"
    static let SimpleObject: JSProperty = "SimpleObject"
    static let staticVoidNoArgMethodCalled: JSProperty = "staticVoidNoArgMethodCalled"
    static let methodToOverrideCalled: JSProperty = "methodToOverrideCalled"
    static let staticVoidNoArgMethod: JSProperty = "staticVoidNoArgMethod"
    static let numberSingleObjectArgMethod: JSProperty = "numberSingleObjectArgMethod"
    static let callOverriddenMethod: JSProperty = "callOverriddenMethod"
    static let methodToOverride: JSProperty = "methodToOverride"
    static let upcastThisToObject: JSProperty = "upcastThisToObject"
    static let simpleObjectInstance: JSProperty = "simpleObjectInstance"
    static let anyObjectInstance: JSProperty = "anyObjectInstance"
    static let optionalAnyObjectInstance: JSProperty = "optionalAnyObjectInstance"
    static let simpleInterfaceInstanceCalled: JSProperty = "simpleInterfaceInstanceCalled"
    static let SimpleInterface: JSProperty = "SimpleInterface"
    static let voidNoArgMethod: JSProperty = "voidNoArgMethod"
    static let simpleInterfaceInstance: JSProperty = "simpleInterfaceInstance"
    static let acceptSimpleInterface: JSProperty = "acceptSimpleInterface"
}