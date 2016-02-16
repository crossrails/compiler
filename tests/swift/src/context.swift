//
//  js.swift
//  swift
//
//  Created by Nick Bransby-Williams on 12/02/2016.
//
//

import Foundation
import JavaScriptCore

public struct Context {
    
    internal let ref :JSContextRef
    
    private init(classRef :JSClassRef) {
        ref = JSGlobalContextCreate(classRef)
    }
    
    public init() {
        self.init(classRef: COpaquePointer(nilLiteral: ()))
    }
    
    internal func invoke<T>(f: (inout exception :JSValueRef ) -> T) -> T {
        var exception :JSValueRef = nil
        let result = f(exception: &exception)
        if exception != nil {
            preconditionFailure("Exception thrown: \(String(convert: exception, context: self))")
        }
        return result
    }
    
//    public init(globalObjectClass: Class) {
//        self.init(classRef: globalObjectClass.ref)
//    }
    
    public func evaluateScript(script :String, sourceUrl :String) {
        let string = JSStringCreateWithCFString(script)
        let url = JSStringCreateWithCFString(sourceUrl)
        defer {
            JSStringRelease(url)
            JSStringRelease(string)            
        }
        self.invoke {
            JSEvaluateScript(self.ref, string, nil, url, 0, &$0)
        }
    }
    
    public func evaluateScript(path :String) throws {
        self.evaluateScript(try NSString(contentsOfFile: path, encoding: NSUTF8StringEncoding) as String, sourceUrl:path)
    }
    
}

