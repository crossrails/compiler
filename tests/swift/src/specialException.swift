//
//  specialException.swift
//  swift
//
//  Created by Nick Bransby-Williams on 16/03/2016.
//
//

import Foundation

public class SpecialException : Equatable, ErrorType {
    
    private static var this :JSClass {
        get { return src.this["SpecialException"] }
    }
    
    private let this :JSInstance;
    private var proxy :JSInstance!;
    
    public init(_ message :String) {
        self.this = try! SpecialException.this.construct(SpecialException.this.valueOf(message))
        self.proxy = self.dynamicType === SpecialException.self ? this : JSObject(this.context, prototype: this, callbacks: [:])
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

public func ==(lhs: SpecialException, rhs: SpecialException) -> Bool {
    return lhs as AnyObject == rhs as AnyObject
}
