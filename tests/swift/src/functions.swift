import Foundation

public var voidNoArgFunctionCalled :Bool {
    get {
        return Bool(this[.voidNoArgFunctionCalled])
    }
    set {
        this[.voidNoArgFunctionCalled] = this.valueOf(voidNoArgFunctionCalled)
    }
}

public func voidNoArgFunction() {
    try! this[.voidNoArgFunction]()
}

public func stringNoArgFunction() -> String {
    return String(try! this[.stringNoArgFunction]())
}

public func numberMultipleArgFunction(a: Double, b: Double) -> Double {
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

public class SpecialError {

    public func init(message: String) {
        self.this = try! SimpleObject.this.construct(this.valueOf(message)) 
        self.proxy = self.dynamicType === SimpleObject.self ? this : JSObject(this.context, prototype: this, callbacks: [ 
 
        ]) 
        this.bind(self) 
    }

}
    
public func throwSpecialError() throws {
    do {
        try this[.throwSpecialError]()
    } catch let error as Error {
        throw new SpecialError(error.exception)
    }
}