#include <optional>

#include <jsrt.h>

using namespace std;

bool getVoidNoArgFunctionCalled();
    
void setVoidNoArgFunctionCalled(bool voidNoArgFunctionCalled);
    
public func voidNoArgFunction() {
    _ = try! this[.voidNoArgFunction]()
}

public func stringNoArgFunction() -> wstring {
    return wstring(try! this[.stringNoArgFunction]())
}

public func numberMultipleArgFunction(undefineda: double, undefinedb: double) -> double {
    return double(try! this[.numberMultipleArgFunction](this.valueOf(a), this.valueOf(b)))
}

() -> wstring getStringNoArgLambda();
    
void setStringNoArgLambda(() -> wstring stringNoArgLambda);
    
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

    public wstring getMessage();
    
    public void setMessage(wstring message);
    
    public init(undefinedmessage: wstring) {
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