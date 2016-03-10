//
//  js.swift
//  swift
//
//  Created by Nick Bransby-Williams on 08/03/2016.
//
//

import Foundation

struct JSArray<T> : MutableCollectionType {
    
    var startIndex: Int {
        return 0
    }
    
    var endIndex: Int {
        return
    }
    
    subscript(position: Int) -> T {
        get { fatalError() }
        mutating set { fatalError() }
    }
}