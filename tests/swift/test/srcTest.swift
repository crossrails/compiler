//
//  test.swift
//  test
//
//  Created by Nick Bransby-Williams on 06/02/2016.
//
//

import XCTest
@testable import src

class test: XCTestCase {
    
    override func setUp() {
        super.setUp()
    }
    
    override func tearDown() {
        try! this.context.eval(NSBundle(identifier: "io.xrails.src")!.pathForResource("src", ofType: "js")!) as Void
    }
    
    static var testInterfaceMethodCalled = false;
    
    class SimpleInterfaceImpl : SimpleInterface {
        func voidNoArgMethod() {
            testInterfaceMethodCalled = true;
        }
    }

    func testInterface() {
        XCTAssertFalse(simpleInterfaceInstanceCalled);
        simpleInterfaceInstance.voidNoArgMethod();
        XCTAssert(simpleInterfaceInstanceCalled);
        acceptSimpleInterface(SimpleInterfaceImpl());
        XCTAssert(test.testInterfaceMethodCalled);
        test.testInterfaceMethodCalled = false;
        simpleInterfaceInstance.voidNoArgMethod();
        XCTAssert(test.testInterfaceMethodCalled);
    }
    
    static var testInheritanceMethodCalled = false;
    
    class SimpleObjectOverride : SimpleObject {
        override func methodToOverride() {
            testInheritanceMethodCalled = true;
        }
    }
    
    class SimpleObjectOverrideCallSuper : SimpleObject {
        override func methodToOverride() {
            super.methodToOverride()
        }
    }
    
    func testInheritance() {
        var o = SimpleObject(5);
        o.callOverriddenMethod();
        XCTAssert(o.methodToOverrideCalled);
        
        o = SimpleObjectOverride(5)
        o.callOverriddenMethod();
        XCTAssert(test.testInheritanceMethodCalled);
        XCTAssertFalse(o.methodToOverrideCalled);
        
        o = SimpleObjectOverrideCallSuper(5)
        o.methodToOverride();
        XCTAssert(o.methodToOverrideCalled);
    }
    
    func testObjects() {
        SimpleObject.staticVoidNoArgMethod();
        
        XCTAssertNotNil(simpleObjectInstance);
        
        XCTAssertEqual(49.0, simpleObjectInstance.numberSingleObjectArgMethod(simpleObjectInstance));
        
        XCTAssertEqual(14.0, simpleObjectInstance.numberSingleObjectArgMethod(SimpleObject(2)));
        
        XCTAssertEqual(simpleObjectInstance, simpleObjectInstance);
        XCTAssert(simpleObjectInstance == simpleObjectInstance.upcastThisToObject());
        XCTAssert(simpleObjectInstance.upcastThisToObject() == simpleObjectInstance);
        XCTAssert(simpleObjectInstance.upcastThisToObject() == simpleObjectInstance.upcastThisToObject());
    }
    
    func testFunctions() {
        voidNoArgFunction();
        XCTAssert(voidNoArgFunctionCalled);
    
        XCTAssertEqual("stringNoArgFunctionReturnValue", stringNoArgFunction());
        
        XCTAssertEqual(25.0, numberMultipleArgFunction(5, b: 5));
        XCTAssertEqual(-3.0, numberMultipleArgFunction(-2, b: 1.5));
        
        XCTAssertEqual("stringNoArgLambdaReturnValue", stringNoArgLambda());
        XCTAssertEqual(stringNoArgLambda(), stringNoArgLambda());
        
        stringNoArgLambda = { "expectedReturnValue" };
        XCTAssertEqual("expectedReturnValue", stringNoArgLambda());
    }
    
    func testConstTypes() {
        XCTAssertFalse(booleanConst)
        XCTAssert(numberConst.isNaN)
        XCTAssertEqual(stringConst, "stringConstLiteral")
        XCTAssertEqual(numberArrayConst, [1, 2, 3])
        XCTAssertEqual(stringArrayArrayConst, [["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"]])
        XCTAssertEqual(anyConst as? String, "anyConstLiteral")
    }
    
    func testOptionalConstTypes() {
        XCTAssertNil(optionalBooleanConst)
        XCTAssertNil(optionalNumberConst)
        XCTAssertNil(optionalStringConst)
        XCTAssertNil(optionalNumberArrayConst)
        XCTAssertNil(optionalAnyConst);
    }
    
    func testVarTypes() {
        XCTAssertTrue(booleanVar)
        booleanVar = booleanConst
        XCTAssertEqual(booleanVar, booleanConst)
        
        XCTAssertEqual(numberVar, 0)
        numberVar = numberConst
        XCTAssert(numberVar.isNaN)
        
        XCTAssertEqual(stringVar, "stringVarLiteral")
        stringVar = stringConst
        XCTAssertEqual(stringVar, stringConst)
        
        XCTAssertEqual(anyVar as? String, "anyVarLiteral")
        anyVar = anyConst
        XCTAssertEqual(anyVar as? String, anyConst as? String)
        
        XCTAssertEqual(numberArrayVar, [])
        numberArrayVar = numberArrayConst
        XCTAssertEqual(numberArrayVar, numberArrayConst)

        XCTAssertEqual(stringArrayArrayVar, [])
        stringArrayArrayVar = stringArrayArrayConst
        XCTAssertEqual(stringArrayArrayVar, stringArrayArrayConst)
        
        numberArrayVar = [5]
        XCTAssertEqual(numberArrayVar, [5])
        
        stringArrayArrayVar = [["yo"]]
        XCTAssertEqual(stringArrayArrayVar, [["yo"]])
    }
    
    
    func testOptionalVarTypes() {
        XCTAssertNil(optionalBooleanVar)
        optionalBooleanVar = false
        XCTAssertEqual(optionalBooleanVar, booleanConst)
        optionalBooleanVar = nil
        XCTAssertNil(optionalBooleanVar)
        
        XCTAssertNil(optionalNumberVar)
        optionalNumberVar = 4000
        XCTAssertEqual(optionalNumberVar, 4000)
        optionalNumberVar = nil
        XCTAssertNil(optionalNumberVar)
        
        XCTAssertNil(optionalStringVar)
        optionalStringVar = "stringConstLiteral"
        XCTAssertEqual(optionalStringVar, stringConst)
        optionalStringVar = nil
        XCTAssertNil(optionalStringVar)
        
        XCTAssertNil(optionalAnyVar)
        optionalAnyVar = "anyConstLiteral"
        XCTAssertEqual(optionalAnyVar as? String, anyConst as? String)
        optionalAnyVar = nil
        XCTAssertNil(optionalAnyVar)
    }

    func testNoErasureForBasicTypes() {
        anyVar = booleanConst;
        XCTAssertEqual(anyVar as? Bool, booleanConst);
    }
    
    func testErasureForNonBasicTypes() {
        XCTAssert(anyObjectInstance as? AnyObject === anyObjectInstance as? AnyObject);
        anyVar = anyObjectInstance;
        XCTAssert(anyVar == anyObjectInstance);
        XCTAssertFalse(anyVar as? AnyObject === anyObjectInstance as? AnyObject);
    }
    
}
