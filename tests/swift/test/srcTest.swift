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
        try! this.context.eval(NSBundle(identifier: "io.xrails.src")!.pathForResource("src", ofType: "js")!)
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
        anyVar = booleanConst;
        XCTAssertEqual(anyVar as? Bool, booleanConst);
    }
    
}
