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
    _ = try! this[.voidNoArgFunction]()
}

public func stringNoArgFunction() -> String {
    return String(try! this[.stringNoArgFunction]())
}

public func numberMultipleArgFunction(a: Double, b: Double) -> Double {
    return Double(try! this[.numberMultipleArgFunction](this.valueOf(a), this.valueOf(b)))
}

public var stringNoArgLambda :() -> String {
    get {
        let function: JSFunction = this[.stringNoArgLambda]
        return { () in return String(try! function.call(this)) }
    }
    set {
        this[.stringNoArgLambda] = JSObject(this.context, callback: { args in return this.valueOf(newValue()) })
    }
}

public func throwSimpleError() throws {
    _ = try this[.throwSimpleError]()
}

public class SpecialError: Equatable, Error {

    private static var this: JSClass { 
        get { return src.this["SpecialError"] } 
    } 
     
    private let this: JSInstance
    private var proxy: JSInstance!
    
    init(_ instance: JSInstance) { 
        this = instance 
        proxy = instance 
        this.bind(self)
    }

    deinit { 
        this.unbind(self)
    }

    public var message :String {
        get {
            return String(proxy[.message])
        }
        set {
            proxy[.message] = this.valueOf(newValue)
        }
    }

    public init(message: String) {
        self.this = try! SpecialError.this.construct(SpecialError.this.valueOf(message)) 
        self.proxy = this 
        this.bind(self) 
    }
}    

public func ==(lhs: SpecialError, rhs: SpecialError) -> Bool { 
    return lhs as AnyObject === rhs as AnyObject
}
    
public func throwSpecialError() throws {
    do {
        _ = try this[.throwSpecialError]()
    } catch let error as JSError {
        throw SpecialError(error.exception)
    }
}