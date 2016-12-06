#include <optional>

#include <jsrt.h>

using namespace std;

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

    public static bool getStaticVoidNoArgMethodCalled();
    
    public static void setStaticVoidNoArgMethodCalled(bool staticVoidNoArgMethodCalled);
    
    public bool getMethodToOverrideCalled();
    
    public void setMethodToOverrideCalled(bool methodToOverrideCalled);
    
    public init(undefinedv: double? = nil) {
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

    public func numberSingleObjectArgMethod(undefineda: SimpleObject) -> double {
        return double(try! this[.numberSingleObjectArgMethod].call(proxy, args: this.valueOf(a)))
    }

    public func callOverriddenMethod() {
        _ = try! this[.callOverriddenMethod].call(proxy)
    }

    public func methodToOverride() {
        _ = try! this[.methodToOverride].call(proxy)
    }

    public func upcastThisToObject() -> any {
        return try! this[.upcastThisToObject].call(proxy).infer()
    }
}    

public func ==(lhs: SimpleObject, rhs: SimpleObject) -> Bool { 
    return lhs as AnyObject === rhs as AnyObject
}
    
SimpleObject getSimpleObjectInstance();
    
any getAnyObjectInstance();
    
optional<any> getOptionalAnyObjectInstance();
    
void setOptionalAnyObjectInstance(any optionalAnyObjectInstance);
    
bool getSimpleInterfaceInstanceCalled();
    
void setSimpleInterfaceInstanceCalled(bool simpleInterfaceInstanceCalled);
    
public class SimpleInterface {

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
    
SimpleInterface getSimpleInterfaceInstance();
    
void setSimpleInterfaceInstance(SimpleInterface simpleInterfaceInstance);
    
public func acceptSimpleInterface(undefinedsimpleInterface: SimpleInterface) {
    _ = try! this[.acceptSimpleInterface](this.valueOf(simpleInterface, with: simpleInterface.eval))
}