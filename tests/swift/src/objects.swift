import Foundation

public class SimpleObject: Equatable {

    private static var this: JSClass { 
        get { return src.this["SimpleObject"] } 
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

    public static var staticVoidNoArgMethodCalled :Bool {
        get {
            return Bool(this[.staticVoidNoArgMethodCalled])
        }
        set {
            this[.staticVoidNoArgMethodCalled] = this.valueOf(newValue)
        }
    }

    public var methodToOverrideCalled :Bool {
        get {
            return Bool(proxy[.methodToOverrideCalled])
        }
        set {
            proxy[.methodToOverrideCalled] = this.valueOf(newValue)
        }
    }

    public init(v: Double? = nil) {
        self.this = try! SimpleObject.this.construct(SimpleObject.this.valueOf(v)) 
        self.proxy = type(of: self) === SimpleObject.self ? this : JSObject(this.context, prototype: this, callbacks: [ 
            "numberSingleObjectArgMethod": { args in 
                return self.this.valueOf(self.numberSingleObjectArgMethod(a: SimpleObject(args[0])))
            }, 
            "callOverriddenMethod": { args in 
                self.callOverriddenMethod() 
                return nil
            }, 
            "methodToOverride": { args in 
                self.methodToOverride() 
                return nil
            }, 
            "upcastThisToObject": { args in 
                return self.this.valueOf(self.upcastThisToObject())
            } 
        ]) 
        this.bind(self) 
    }

    public static func staticVoidNoArgMethod() {
        _ = try! this[.staticVoidNoArgMethod]()
    }

    public func numberSingleObjectArgMethod(a: SimpleObject) -> Double {
        return Double(try! this[.numberSingleObjectArgMethod].call(proxy, args: this.valueOf(a)))
    }

    public func callOverriddenMethod() {
        _ = try! this[.callOverriddenMethod].call(proxy)
    }

    public func methodToOverride() {
        _ = try! this[.methodToOverride].call(proxy)
    }

    public func upcastThisToObject() -> Any {
        return try! this[.upcastThisToObject].call(proxy).infer()
    }
}    

public func ==(lhs: SimpleObject, rhs: SimpleObject) -> Bool { 
    return lhs as AnyObject === rhs as AnyObject
}
    
public let simpleObjectInstance :SimpleObject = SimpleObject(this[.simpleObjectInstance])

public let anyObjectInstance :Any = this[.anyObjectInstance].infer()

public var optionalAnyObjectInstance :Any? {
    get {
        return Any?(this[.optionalAnyObjectInstance], wrapped: { $0.infer() })
    }
    set {
        this[.optionalAnyObjectInstance] = this.valueOf(newValue, wrapped: this.valueOf)
    }
}

public var simpleInterfaceInstanceCalled :Bool {
    get {
        return Bool(this[.simpleInterfaceInstanceCalled])
    }
    set {
        this[.simpleInterfaceInstanceCalled] = this.valueOf(newValue)
    }
}

public protocol SimpleInterface: class {

    func voidNoArgMethod()
}

extension SimpleInterface {
    func eval(_ context: JSContext) -> JSValue {
        return JSObject(context, callbacks: [
            "voidNoArgMethod": { args in
                self.voidNoArgMethod()
                return nil
            }    
        ])
    }
}

class JS_SimpleInterface: SimpleInterface {
    
    private let this: JSInstance
    
    init(_ instance: JSInstance) {
        this = instance
        this.bind(self)
    }
    
    deinit {
        this.unbind(self)
    }

    func voidNoArgMethod() {
        _ = try! this[.voidNoArgMethod]()
    }

}
    
public var simpleInterfaceInstance :SimpleInterface {
    get {
        return JS_SimpleInterface(this[.simpleInterfaceInstance])
    }
    set {
        this[.simpleInterfaceInstance] = this.valueOf(newValue, with: newValue.eval)
    }
}

public func acceptSimpleInterface(simpleInterface: SimpleInterface) {
    _ = try! this[.acceptSimpleInterface](this.valueOf(simpleInterface, with: simpleInterface.eval))
}