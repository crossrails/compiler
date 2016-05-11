import {Emitter, Output} from "../transpiler" 
import * as ast from "../ast" 

class Swift implements Emitter, ast.TypeVisitor<string> {
    
    emitModule(node: ast.Module, out: Output) {
    }
    
    emitSourceFile(node: ast.SourceFile, out :Output) {
        //insert header comment
        out.writeFile(`${node.filename}.swift`, `import Foundation\n\n`);
    }
    
    emitConstant(node: ast.VariableDeclaration, out :Output) {
        if(node.type instanceof ast.AnyType) {
        } else {
        }
    }
    
    emitVariable(node: ast.VariableDeclaration, out :Output) {
        let keyword = node.constant ? 'let' : 'var';
        out.writeFile(`${node.sourceFile.filename}.swift`, `public ${keyword} ${node.name} :${node.type.accept(this)}`);                        
    }
    
    emitClass(node: ast.ClassDeclaration, out :Output) {
        
    }
    
    emitMethod(node: ast.MethodDeclaration, out :Output) {
        
    }
    
    visitAnyType(node: ast.AnyType): string {
        return `Any`;
    }
    
    visitStringType(node: ast.StringType): string {
        return 'String'
    }
    
    visitNumberType(node: ast.NumberType): string {
        return 'Double'
    }
    
    visitBooleanType(node: ast.BooleanType): string {
        return 'Bool'
    }
    
    visitArrayType(node: ast.ArrayType): string {
        return `[${node.typeArguments[0].accept(this)}]`;        
    }
}

export = new Swift();

