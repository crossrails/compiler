//
//  js.swift
//  swift
//
//  Created by Nick Bransby-Williams on 08/03/2016.
//
//

import Foundation

struct JS {
    struct Array<T> : MutableCollectionType {
        var startIndex: Int { fatalError() }
        
        var endIndex: Int { fatalError() }
        
        subscript(position: Int) -> Test {
            get { fatalError() }
            mutating set { fatalError() }
        }
    }
}