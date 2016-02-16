//
//  src.swift
//  swift
//
//  Created by Nick Bransby-Williams on 07/02/2016.
//
//

import Foundation
import JS

extension Property {
    static let booleanConst : Property = "booleanConst"
    static let numberConst : Property = "numberConst"
    static let stringConst : Property = "stringConst"
    static let anyConst : Property = "anyConst"
    static let booleanVar : Property = "booleanVar"
    static let numberVar : Property = "numberVar"
    static let stringVar : Property = "stringVar"
    static let anyVar : Property = "anyVar"
}

private let context : Context = {
    let context = Context()
    try! context.evaluateScript(NSBundle(identifier: "io.xrails.src")!.pathForResource("src", ofType: "js")!)
    return context
}()

var this = Proxy(globalObjectOfContext: context)

