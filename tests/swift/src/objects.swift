import Foundation

public class SimpleObject {

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
            return Bool(this[.methodToOverrideCalled])
        }
        set {
            this[.methodToOverrideCalled] = this.valueOf(newValue)
        }
    }

    public func init(v: Double) {
        self.this = try! SimpleObject.this.construct(this.valueOf(v)) 
        self.proxy = self.dynamicType === SimpleObject.self ? this : JSObject(this.context, prototype: this, callbacks: [ 
            "numberSingleObjectArgMethod": { args in 
                return self.numberSingleObjectArgMethod(args)
            }, 
            "callOverriddenMethod": { args in 
                self.callOverriddenMethod(args) 
                return null
            }, 
            "methodToOverride": { args in 
                self.methodToOverride(args) 
                return null
            }, 
            "upcastThisToObject": { args in 
                return self.upcastThisToObject(args)
            } 
        ]) 
        this.bind(self) 
    }

    public static func staticVoidNoArgMethod() {
        try! this[.staticVoidNoArgMethod]()
    }

    public func numberSingleObjectArgMethod(a: SimpleObject) -> Double {
        return Double(try! this[.numberSingleObjectArgMethod](this.valueOf(a)))
    }

    public func callOverriddenMethod() {
        try! this[.callOverriddenMethod]()
    }

    public func methodToOverride() {
        try! this[.methodToOverride]()
    }

    public func upcastThisToObject() -> Any {
        return try! this[.upcastThisToObject]().infer()
    }

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

public protocol SimpleInterface {

    public func voidNoArgMethod()

}
    
public var simpleInterfaceInstance :SimpleInterface {
    get {
        return SimpleInterface(this[.simpleInterfaceInstance])
    }
    set {
        this[.simpleInterfaceInstance] = this.valueOf(newValue)
    }
}

public func acceptSimpleInterface(simpleInterface: SimpleInterface) {
    try! this[.acceptSimpleInterface](this.valueOf(simpleInterface))
}