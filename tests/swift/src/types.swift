//
//  index.swift
//  swift
//
//  Created by Nick Bransby-Williams on 06/02/2016.
//
//

import Foundation
import JS


//constants

public let booleanConst :Bool = this[.booleanConst]

public let numberConst :Double = this[.numberConst]

public let stringConst :String = this[.stringConst]

//variables

public var booleanVar :Bool {
    get {
        return this[.booleanVar]
    }
    set {
        this[.booleanVar] = newValue
    }
}

public var numberVar :Double {
    get {
        return this[.numberVar]
    }
    set {
        this[.numberVar] = newValue
    }
}


public var stringVar :String? {
    get {
        return this[.stringVar]
    }
    set {
        this[.stringVar] = newValue
    }
}
