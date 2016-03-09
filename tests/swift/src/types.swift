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

public let booleanConst :Bool = this.get(.booleanConst)

public let numberConst :Double = this.get(.numberConst)

public let stringConst :String = this.get(.stringConst)

public let numberArrayConst :[Double] = this.get(.numberArrayConst)

public let stringArrayArrayConst :[[String]] = this.get(.stringArrayArrayConst)

//nullable constants

public let optionalBooleanConst :Bool? = this.get(.optionalBooleanConst)

public let optionalNumberConst :Double? = this.get(.optionalNumberConst)

public let optionalStringConst :String? = this.get(.optionalStringConst)

public let optionalNumberArrayConst :[Double]? = this.get(.optionalNumberArrayConst)


//variables

public var booleanVar :Bool {
    get {
        return this.get(.booleanVar)
    }
    set {
        this.set(.booleanVar, newValue: newValue)
    }
}

public var numberVar :Double {
    get {
        return this.get(.numberVar)
    }
    set {
        this.set(.numberVar, newValue: newValue)
    }
}


public var stringVar :String {
    get {
        return this.get(.stringVar)
    }
    set {
        this.set(.stringVar, newValue: newValue)
    }
}

//nullable variables

public var optionalBooleanVar :Bool? {
    get {
        return this.get(.optionalBooleanVar)
    }
    set {
        this.set(.optionalBooleanVar, newValue: newValue)
    }
}

public var optionalNumberVar :Double? {
    get {
        return this.get(.optionalNumberVar)
    }
    set {
        this.set(.optionalNumberVar, newValue: newValue)
    }
}


public var optionalStringVar :String? {
    get {
        return this.get(.optionalStringVar)
    }
    set {
        this.set(.optionalStringVar, newValue: newValue)
    }
}
