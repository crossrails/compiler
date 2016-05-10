import {Emitter, Output} from "../../transpiler" 
import {VariableDeclaration, ClassDeclaration, MethodDeclaration, Module, Declaration, SourceFile} from "../../ast" 

class JavaScriptCore implements Emitter {
    
    emitModule(node: Module, out: Output) {
        //copy in js.swift
        //create module_name.swift and add script loader
        //add extension JSProperty {}
        //define global this 
        out.emitChildren();
    }
    
    emitSourceFile(node: SourceFile, out: Output) {
        //insert header comment
        out.writeFile(`${node.filename}.swift`, `import Foundation\n`);
        out.emitChildren();
        
    }
    
    emitClass(node: ClassDeclaration, out: Output) {
        
    }
    
    emitMethod(node: MethodDeclaration, out: Output) {
        
    }
    
    emitVariable(node: VariableDeclaration, out: Output) {
        // = this[.name].infer()
    }    
}

export = new JavaScriptCore();