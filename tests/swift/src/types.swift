import Foundation


public let booleanConst :Bool = Bool(this[.booleanConst])

public let numberConst :Double = Double(this[.numberConst])

public let stringConst :String = String(this[.stringConst])

public let numberOrNullArrayConst :[Double?] = [Double?](this[.numberOrNullArrayConst], element: { Double?($0, wrapped: Double.init) })

public let numberArrayConst :[Double] = [Double](this[.numberArrayConst], element: Double.init)

public let stringArrayArrayConst :[[String]] = [[String]](this[.stringArrayArrayConst], element: { [String]($0, element: String.init) })

public let anyConst :Any = this[.anyConst].infer()

public let optionalBooleanConst :Bool? = Bool?(this[.optionalBooleanConst], wrapped: Bool.init)

public let optionalNumberConst :Double? = Double?(this[.optionalNumberConst], wrapped: Double.init)

public let optionalStringConst :String? = String?(this[.optionalStringConst], wrapped: String.init)

public let optionalNumberArrayConst :[Double]? = [Double]?(this[.optionalNumberArrayConst], wrapped: { [Double]($0, element: Double.init) })

public let optionalNullAnyConst :Any? = Any?(this[.optionalNullAnyConst], wrapped: { $0.infer() })

public let optionalNonNullAnyConst :Any? = Any?(this[.optionalNonNullAnyConst], wrapped: { $0.infer() })

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

public var numberArrayVar :[Double] {
    get {
        return [Double](this[.numberArrayVar], element: Double.init)
    }
    set {
        this[.numberArrayVar] = this.valueOf(newValue, element: this.valueOf)
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

public var stringArrayArrayVar :[[String]] {
    get {
        return [[String]](this[.stringArrayArrayVar], element: { [String]($0, element: String.init) })
    }
    set {
        this[.stringArrayArrayVar] = this.valueOf(newValue, element: { this.valueOf($0, element: this.valueOf) })
    }
}

public var optionalBooleanVar :Bool? {
    get {
        return Bool?(this[.optionalBooleanVar], wrapped: Bool.init)
    }
    set {
        this[.optionalBooleanVar] = this.valueOf(newValue, wrapped: this.valueOf)
    }
}

public var optionalNumberVar :Double? {
    get {
        return Double?(this[.optionalNumberVar], wrapped: Double.init)
    }
    set {
        this[.optionalNumberVar] = this.valueOf(newValue, wrapped: this.valueOf)
    }
}

public var optionalStringVar :String? {
    get {
        return String?(this[.optionalStringVar], wrapped: String.init)
    }
    set {
        this[.optionalStringVar] = this.valueOf(newValue, wrapped: this.valueOf)
    }
}

public var optionalNumberArrayVar :[Double]? {
    get {
        return [Double]?(this[.optionalNumberArrayVar], wrapped: { [Double]($0, element: Double.init) })
    }
    set {
        this[.optionalNumberArrayVar] = this.valueOf(newValue, wrapped: { this.valueOf($0, element: this.valueOf) })
    }
}

public var optionalAnyVar :Any? {
    get {
        return Any?(this[.optionalAnyVar], wrapped: { $0.infer() })
    }
    set {
        this[.optionalAnyVar] = this.valueOf(newValue, wrapped: this.valueOf)
    }
}