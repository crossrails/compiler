import Foundation

public var voidNoArgFunctionCalled :Bool {
    get {
        return Bool(this[.voidNoArgFunctionCalled])
    }
    set {
        this[.voidNoArgFunctionCalled] = this.valueOf(newValue)
    }
}

public func voidNoArgFunction() {
    try! this[.voidNoArgFunction]()
}

public func stringNoArgFunction() -> String {
    return String(try! this[.stringNoArgFunction]())
}

public func numberMultipleArgFunction(_ a: Double, b: Double) -> Double {
    return Double(try! this[.numberMultipleArgFunction](this.valueOf(a), this.valueOf(b)))
}

public var stringNoArgLambda :() -> (String) {
    get {
        let function :JSFunction = this[.stringNoArgLambda]
        return { () in return String(try! function.call(this)) }
    }
    set {
        this[.stringNoArgLambda] = JSObject(this.context, callback: { args in return this.valueOf(newValue()) })
    }
}

public func throwSimpleError() throws {
    try this[.throwSimpleError]()
}

public class SpecialError : Equatable, ErrorProtocol {
    
    private static var this :JSClass {
        get { return src.this["SpecialException"] }
    }
    
    private let this :JSInstance;
    private var proxy :JSInstance!;
    
    public init(_ message :String) {
        self.this = try! SpecialError.this.construct(SpecialError.this.valueOf(message))
        self.proxy = self.dynamicType === SpecialError.self ? this : JSObject(this.context, prototype: this, callbacks: [:])
        this.bind(self)
    }
    
    init(_ instance :JSInstance) {
        this = instance
        proxy = instance;
        this.bind(self)
    }
    
    deinit {
        this.unbind(self)
    }
    
    var message :String {
        get {
            return String(this[.message]);
        }
    }
}

public func ==(lhs: SpecialError, rhs: SpecialError) -> Bool {
    return lhs as AnyObject == rhs as AnyObject
}

    
public func throwSpecialError() throws {
    do {
        try this[.throwSpecialError]()
    } catch let error as Error {
        throw SpecialError(error.exception)
    }
}
