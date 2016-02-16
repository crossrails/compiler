//
//  class.swift
//  swift
//
//  Created by Nick Bransby-Williams on 15/02/2016.
//
//

import Foundation
import JavaScriptCore

protocol JavaScriptObject {
    static var javaScriptClass :Class { get }
}

struct Class {
    
    internal let ref :JSClassRef
    
    init() {
        ref = nil
        //    var definition :JSClassDefinition = kJSClassDefinitionEmpty
        //    let proxy = JSClassCreate(&definition)
        //    JSClassRelease(proxy)
    }
    
}