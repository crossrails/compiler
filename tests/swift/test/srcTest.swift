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
        super.tearDown()
    }
    
    func testTypes() {
        XCTAssertFalse(booleanConst)
        XCTAssert(numberConst.isNaN)
        XCTAssertEqual(stringConst, "stringConstLiteral")
//        XCTAssertEqual(numberArrayConst, [1, 2, 3])
        
        XCTAssertNil(optionalBooleanConst)
        XCTAssertNil(optionalNumberConst)
        XCTAssertNil(optionalStringConst)
        XCTAssertNil(optionalNumberArrayConst)
        
        XCTAssertTrue(booleanVar)
        booleanVar = booleanConst
        XCTAssertEqual(booleanVar, booleanConst)
        
        XCTAssertEqual(numberVar, 0)
        numberVar = numberConst
        XCTAssert(numberVar.isNaN)
        
        XCTAssertEqual(stringVar, "stringVarLiteral")
        stringVar = stringConst
        XCTAssertEqual(stringVar, stringConst)
        
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
        
    }
}
