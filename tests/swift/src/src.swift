//
//  src.swift
//  swift
//
//  Created by Nick Bransby-Williams on 07/02/2016.
//
//

import Foundation

extension JS.Property {
    static let booleanConst : JS.Property = "booleanConst"
    static let numberConst : JS.Property = "numberConst"
    static let stringConst : JS.Property = "stringConst"
    static let numberArrayConst : JS.Property = "numberArrayConst"
    static let stringArrayArrayConst : JS.Property = "stringArrayArrayConst"
    static let anyConst : JS.Property = "anyConst"
    static let optionalBooleanConst : JS.Property = "optionalBooleanConst"
    static let optionalNumberConst : JS.Property = "optionalNumberConst"
    static let optionalStringConst : JS.Property = "optionalStringConst"
    static let optionalNumberArrayConst : JS.Property = "optionalNumberArrayConst"
    static let booleanVar : JS.Property = "booleanVar"
    static let numberVar : JS.Property = "numberVar"
    static let stringVar : JS.Property = "stringVar"
    static let numberArrayVar : JS.Property = "numberArrayVar"
    static let anyVar : JS.Property = "anyVar"
    static let optionalBooleanVar : JS.Property = "optionalBooleanVar"
    static let optionalNumberVar : JS.Property = "optionalNumberVar"
    static let optionalStringVar : JS.Property = "optionalStringVar"
}

private let context : JS.Context = try! JS.Context(NSBundle(identifier: "io.xrails.src")!.pathForResource("src", ofType: "js")!)

var this = context.globalObject

///constants

public let booleanConst = Bool(this[.booleanConst])

public let numberConst = Double(this[.numberConst])

public let stringConst = String(this[.stringConst])

public let numberArrayConst = [Double](this[.numberArrayConst], element: Double.init)

public let stringArrayArrayConst = [[String]](this[.stringArrayArrayConst], element: { [String]($0, element: String.init) })

//nullable constants

public let optionalBooleanConst = Bool?(this[.optionalBooleanConst], wrapped: Bool.init)

public let optionalNumberConst = Double?(this[.optionalNumberConst], wrapped: Double.init)

public let optionalStringConst = String?(this[.optionalStringConst], wrapped: String.init)

public let optionalNumberArrayConst :[Double]? = [Double]?(this[.optionalNumberConst], wrapped: { [Double]($0, element: Double.init) })


//variables

public var booleanVar :Bool {
    get {
        return Bool(this[.booleanVar])
    }
    set {
        this[.booleanVar] = newValue.eval(this.context)
    }
}

public var numberVar :Double {
    get {
        return Double(this[.numberVar])
    }
    set {
        this[.numberVar] = newValue.eval(this.context)
    }
}


public var stringVar :String {
    get {
        return String(this[.stringVar])
    }
    set {
        this[.stringVar] = newValue.eval(this.context)
    }
}

public var numberArrayVar :[Double] {
    get {
        return [Double](this[.numberArrayConst], element: Double.init)
    }
    set {
        this[.numberArrayVar] = newValue.eval(this.context, element: { $0.eval(this.context) })
    }
}

//nullable variables

public var optionalBooleanVar :Bool? {
    get {
        return Bool?(this[.optionalBooleanVar], wrapped: Bool.init)
    }
    set {
        this[.optionalBooleanVar] = newValue.eval(this.context, wrapped: { $0.eval(this.context) })
    }
}

public var optionalNumberVar :Double? {
    get {
        return Double?(this[.optionalNumberVar], wrapped: Double.init)
    }
    set {
        this[.optionalNumberVar] = newValue.eval(this.context, wrapped: { $0.eval(this.context) })
    }
}


public var optionalStringVar :String? {
    get {
        return String?(this[.optionalStringVar], wrapped: String.init)
    }
    set {
        this[.optionalStringVar] = newValue.eval(this.context, wrapped: { $0.eval(this.context) })
    }
}
