//
//  stringCopy.swift
//  swift
//
//  Created by Nick Bransby-Williams on 14/02/2016.
//
//

import Foundation
import JavaScriptCore

internal class StringCopy : CustomStringConvertible {
    
    internal let ref :JSStringRef
    
    private lazy var string :String = JSStringCopyCFString(nil, self.ref) as String
    
    internal init(_ string: String) {
        self.ref = JSStringCreateWithUTF8CString(string)
        self.string = string
    }
//    
//    internal init(value: Value, context: Context) {
//        //self.ref = JSValueToStringCopy(context.ref, value.ref, nil)
//    }
    
    deinit {
        JSStringRelease(ref)
    }
    
    var description: String {
        return string
    }
}