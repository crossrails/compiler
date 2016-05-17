import Foundation

var this :JSInstance = try! JSContext().eval(NSBundle.mainBundle.pathForResource("types", ofType: "js")!)
    
public let booleanConst :Bool = Bool(this[.booleanConst])
    
public let numberConst :Double = Double(this[.numberConst])
    
public let stringConst :String = String(this[.stringConst])
    
public let numberArrayConst :[Double] = [Double](this[.numberArrayConst], element: Double.init)
    
public let stringArrayArrayConst :[[String]] = [[String]](this[.stringArrayArrayConst], element: { [String]($0, element: String.init) })
    
public let anyConst :Any = this[.anyConst].infer()
    
public let optionalBooleanConst :Bool? = Bool?(this[.optionalBooleanConst])
    
public let optionalNumberConst :Double? = Double?(this[.optionalNumberConst])
    
public let optionalStringConst :String? = String?(this[.optionalStringConst])
    
public let optionalNumberArrayConst :[Double]? = [Double]?(this[.optionalNumberArrayConst], element: Double.init)
    
public let optionalAnyConst :Any? = Any?(this[.optionalAnyConst], wrapped: JSValue.infer)
    
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
        this[.numberArrayVar] = this.valueOf(newValue)
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
        this[.stringArrayArrayVar] = this.valueOf(newValue)
    }
}
    
public var optionalBooleanVar :Bool? {
    get {
        return Bool?(this[.optionalBooleanVar])
    }
    set {
        this[.optionalBooleanVar] = this.valueOf(newValue)
    }
}
    
public var optionalNumberVar :Double? {
    get {
        return Double?(this[.optionalNumberVar])
    }
    set {
        this[.optionalNumberVar] = this.valueOf(newValue)
    }
}
    
public var optionalStringVar :String? {
    get {
        return String?(this[.optionalStringVar])
    }
    set {
        this[.optionalStringVar] = this.valueOf(newValue)
    }
}
    
public var optionalNumberArrayVar :[Double]? {
    get {
        return [Double]?(this[.optionalNumberArrayVar], element: Double.init)
    }
    set {
        this[.optionalNumberArrayVar] = this.valueOf(newValue)
    }
}
    
public var optionalAnyVar :Any? {
    get {
        return Any?(this[.optionalAnyVar], wrapped: JSValue.infer)
    }
    set {
        this[.optionalAnyVar] = this.valueOf(newValue)
    }
}
    

extension JSProperty {
    static let booleanConst : JSProperty = "booleanConst"
    static let numberConst : JSProperty = "numberConst"
    static let stringConst : JSProperty = "stringConst"
    static let numberArrayConst : JSProperty = "numberArrayConst"
    static let stringArrayArrayConst : JSProperty = "stringArrayArrayConst"
    static let anyConst : JSProperty = "anyConst"
    static let optionalBooleanConst : JSProperty = "optionalBooleanConst"
    static let optionalNumberConst : JSProperty = "optionalNumberConst"
    static let optionalStringConst : JSProperty = "optionalStringConst"
    static let optionalNumberArrayConst : JSProperty = "optionalNumberArrayConst"
    static let optionalAnyConst : JSProperty = "optionalAnyConst"
    static let booleanVar : JSProperty = "booleanVar"
    static let numberVar : JSProperty = "numberVar"
    static let stringVar : JSProperty = "stringVar"
    static let numberArrayVar : JSProperty = "numberArrayVar"
    static let anyVar : JSProperty = "anyVar"
    static let stringArrayArrayVar : JSProperty = "stringArrayArrayVar"
    static let optionalBooleanVar : JSProperty = "optionalBooleanVar"
    static let optionalNumberVar : JSProperty = "optionalNumberVar"
    static let optionalStringVar : JSProperty = "optionalStringVar"
    static let optionalNumberArrayVar : JSProperty = "optionalNumberArrayVar"
    static let optionalAnyVar : JSProperty = "optionalAnyVar"
}
    

