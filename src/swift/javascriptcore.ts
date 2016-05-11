import {Emitter, Output} from "../transpiler" 
import * as ast from "../ast" 

class JavaScriptCore implements Emitter {
    private readonly visitor: ast.TypeVisitor<string>  
    private identifiers: Set<string> = new Set();
    
    // constructor(visitor: ast.TypeVisitor<string>) {
    //     this.visitor = visitor;
    // }
    
    emitModule(node: ast.Module, out: Output) {
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
    
    emitSourceFile(node: ast.SourceFile, out: Output) {
        out.emitChildren();
        
    }
    
    emitClass(node: ast.ClassDeclaration, out: Output) {
        this.identifiers.add(node.name);
        
    }
    
    emitMethod(node: ast.MethodDeclaration, out: Output) {
        this.identifiers.add(node.name);
    }
    
    emitConstant(node: ast.VariableDeclaration, out :Output) {
        this.identifiers.add(node.name);
        if(node.type instanceof ast.AnyType) {
            out.writeFile(`${node.sourceFile.filename}.swift`, ` = this[.${node.name}].infer()`);
        } else {
            out.writeFile(`${node.sourceFile.filename}.swift`, ` = ${node.type.accept(this.visitor)}(this[.${node.name}])\n\n`);            
        }
    }
    
    emitVariable(node: ast.VariableDeclaration, out :Output) {
        this.identifiers.add(node.name);
        if(node.type instanceof ast.AnyType) {
            out.writeFile(`${node.sourceFile.filename}.swift`, 
` {
    get {
        return this[.${node.name}].infer()
    }
    set {
        this[.${node.name}] =  this.valueOf(newValue)
    }
}`);
        } else {
            out.writeFile(`${node.sourceFile.filename}.swift`, ` {
    get {
        return ${node.type.accept(this.visitor)}(this[.${node.name}])
    }
    set {
        this[.${node.name}] =  this.valueOf(newValue)
    }
}\n\n`);            
        }
    }

}

export = new JavaScriptCore();