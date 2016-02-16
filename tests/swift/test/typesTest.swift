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
//        XCTAssertEqual(booleanConst, false)
//        
//        XCTAssertEqual(numberConst, 6)
//        
//        XCTAssertEqual(stringConst, "stringConstLiteral")
//                
//        XCTAssertEqual(booleanVar, true)
//        booleanVar = booleanConst
//        XCTAssertEqual(booleanVar, booleanConst)
        
        XCTAssertEqual(stringVar, nil)
        stringVar = stringConst
        XCTAssertEqual(stringVar, stringConst)
        stringVar = nil
        //XCTAssertEqual(stringVar, nil)
        
    }
}
