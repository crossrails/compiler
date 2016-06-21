import * as path from 'path';
import * as ast from "../ast"
import {log} from "../log"
import {CompilerOptions} from "../compiler" 

export interface SwiftOptions extends CompilerOptions {
    javascriptcore?: CompilerOptions 
    bundleId: string|undefined   
}

declare module "../ast" {
    interface Module {
        resourcePath: string
    }

    interface VariableDeclaration {
        body(): string
    }
}
 
ast.Module.prototype.emit = function (this: ast.Module, options: SwiftOptions, writeFile: (filename: string, data: string) => void): void {
    Reflect.set(this, 'resourcePath', `NSBundle${options.bundleId ? `(identifier: "${options.bundleId}")!` : `.mainBundle()`}.pathForResource("src", ofType: "js")!`);
    let moduleFilename = path.join(options.outDir, `${this.name}.swift`);
    let writtenModuleFile = false;  
    for(let file of this.files as Array<ast.SourceFile>) {            
        let filename = `${path.join(options.outDir, path.relative(this.sourceRoot, file.path.dir), file.path.name)}.swift`;
        Object.defineProperty(file, 'isModuleFile', { writable: false, value: filename == moduleFilename});
        writeFile(filename, file.emit());                
        writtenModuleFile = writtenModuleFile || file.isModuleFile;
    }        
    if(!writtenModuleFile) {
        let file: ast.SourceFile = Object.create(ast.SourceFile.prototype, {
            isModuleFile: { value: true},
            module: { value: this },
            name: { value: this.name },
            declarations: { value: [] }
        });
        writeFile(moduleFilename, file.emit());
    }
}

ast.TypeDeclaration.prototype.suffix = function (this: ast.TypeDeclaration): string {
    return '';
}

ast.ClassDeclaration.prototype.suffix = function (this: ast.ClassDeclaration): string {
    return '';
}

ast.InterfaceDeclaration.prototype.keyword = function (this: ast.InterfaceDeclaration): string {
    return "protocol";
}

ast.VariableDeclaration.prototype.emit = function (this: ast.VariableDeclaration, indent?: string): string {
    return `${indent}public ${this.static && this.parent != this.sourceFile ? 'static ' : ''}${this.constant ? 'let' : 'var'} ${this.name} :${this.type.emit()} ${this.body()}\n`;
}

ast.ParameterDeclaration.prototype.emit = function (this: ast.ParameterDeclaration): string {
    return `${this.declarationName()}: ${this.type.emit()}`;
}

ast.FunctionDeclaration.prototype.prefix = function (this: ast.FunctionDeclaration): string {
    return `public ${this.static && this.parent != this.sourceFile ? 'static ' : ''}func`;
}


ast.FunctionDeclaration.prototype.suffix = function (this: ast.FunctionDeclaration): string {
    return `${this.signature.returnType instanceof ast.VoidType ? '' : ` -> ${this.signature.returnType.emit()}`}${this.signature.thrownTypes.length ? ' throws' : ''}`;
}

ast.ConstructorDeclaration.prototype.declarationName = function (this: ast.ConstructorDeclaration): string {
    return `init`;
}

ast.ConstructorDeclaration.prototype.suffix = function (this: ast.ConstructorDeclaration): string {
    return this.signature.thrownTypes.length ? ' throws' : '';
}

ast.Type.prototype.emit = function(this: ast.Type, optional: boolean = this.optional): string {
    return `${this.typeName()}${optional ? '?' : ''}`;    
}

ast.AnyType.prototype.typeName = function(this: ast.AnyType): string {
    return 'Any';  
}

ast.BooleanType.prototype.typeName = function(this: ast.BooleanType): string {
    return 'Bool';    
}

ast.StringType.prototype.typeName = function(this: ast.StringType): string {
    return 'String'    
}

ast.NumberType.prototype.typeName = function(this: ast.NumberType): string {
    return 'Double'    
}

ast.ArrayType.prototype.typeName = function(this: ast.ArrayType): string {
    return `[${this.typeArguments[0].emit()}]`;    
}

ast.FunctionType.prototype.typeName = function(this: ast.FunctionType): string {
    return `(${this.signature.parameters.map(p => `${p.declarationName()} :${p.type.emit()}`).join(', ')}) -> (${this.signature.returnType.emit()})`;
}
