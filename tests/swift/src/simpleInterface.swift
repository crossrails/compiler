//
//  simpleInterface.swift
//  swift
//
//  Created by Nick Bransby-Williams on 13/03/2016.
//
//

import Foundation

public protocol SimpleInterface : class {
    func voidNoArgMethod()
}

extension SimpleInterface {
    func eval(context: JSContext) -> JSValue {
        return JSObject(context, callbacks: [
            "voidNoArgMethod": { args in
                self.voidNoArgMethod()
                return nil
            }
        ])
    }
}

class JS_SimpleInterface : SimpleInterface {
    
    private let this :JSInstance;
    
    init(_ instance :JSInstance) {
        this = instance
        this.bind(self)
    }
    
    deinit {
        this.unbind(self)
    }
    
    func voidNoArgMethod() {
        try! this[.voidNoArgMethod]();
    }
    
}
