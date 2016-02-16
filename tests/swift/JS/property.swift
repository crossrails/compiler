//
//  property.swift
//  swift
//
//  Created by Nick Bransby-Williams on 14/02/2016.
//
//

import Foundation
import JavaScriptCore

public struct Property : CustomStringConvertible, StringLiteralConvertible {
    
    private let string :StringLiteralType
    internal let ref :JSStringRef
    
    public init(unicodeScalarLiteral value: String) {
        self.string = value
        self.ref = JSStringCreateWithUTF8CString(value)
    }
    
    public init(extendedGraphemeClusterLiteral value: String) {
        self.string = value
        self.ref = JSStringCreateWithUTF8CString(value)
    }
    
    public init(stringLiteral value: StringLiteralType) {
        self.string = value
        self.ref = JSStringCreateWithUTF8CString(value)
    }
    
    public var description: String {
        return string
    }
        
}