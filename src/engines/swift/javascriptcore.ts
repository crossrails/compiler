import {Emitter, Output} from "../../transpiler" 
import {VariableDeclaration, ClassDeclaration, MethodDeclaration, Module, Declaration, SourceFile} from "../../ast" 

class JavaScriptCore implements Emitter {
    
    private identifiers: Set<string> = new Set();
    
    emitModule(node: Module, out: Output) {
        out.emitChildren();
        out.copyFile('javascriptcore.swift', 'js.swift');
        
        let file = `${node.name}.swift`;
        if(!out.fileExists(file)) {
            out.writeFile(file, `import Foundation\n\n`);        
        }
        out.writeFile(file, `var this :JSInstance = try! JSContext().eval(NSBundle(identifier: "io.xrails.src")!.pathForResource("src", ofType: "js")!)\n\n`)
        out.writeFile(file, `extension JSProperty {\n`);
        for(let identifier of this.identifiers) {
            out.writeFile(file, `    static let ${identifier} : JSProperty = "${identifier}"\n`);            
        }
        out.writeFile(file, `}\n`);
        //add extension JSProperty {}
        //define global this 
    }
    
    emitSourceFile(node: SourceFile, out: Output) {
        out.emitChildren();
        
    }
    
    emitClass(node: ClassDeclaration, out: Output) {
        this.identifiers.add(node.name);
        
    }
    
    emitMethod(node: MethodDeclaration, out: Output) {
        this.identifiers.add(node.name);
    }
    
    emitVariable(node: VariableDeclaration, out: Output) {
        this.identifiers.add(node.name);
        // = this[.name].infer()
    }    
}

export = new JavaScriptCore();