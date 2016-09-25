import * as path from 'path';
import * as ast from "../ast"
import {decorate} from '../decorator';
import {EmitterOptions} from "../emitter" 
import {
    Module, Type, VoidType, AnyType, BooleanType, StringType, NumberType, ArrayType, VariableDeclaration, ClassDeclaration, InterfaceDeclaration, FunctionDeclaration, ParameterDeclaration, ConstructorDeclaration, FunctionType, DateType, NamespaceDeclaration
} from "../ast"

export interface SwiftOptions extends EmitterOptions {
    javascriptcore?: EmitterOptions 
    bundleId: string|undefined
    omitArgumentLabels: boolean|undefined   
}

declare module "../ast" {
    interface Module {
        resourcePath: string
        parameterPrefix: string
    }

    interface VariableDeclaration {
        body(indent?: string): string
    }
}
 
decorate(Module, ({prototype}) => prototype.emit = function (this: ast.Module, outDir: string, options: SwiftOptions, writeFile: (filename: string, data: string) => void): void {
    Reflect.set(this, 'resourcePath', `Bundle${options.bundleId ? `(identifier: "${options.bundleId}")!` : `.mainBundle()`}.path(forResource: "${this.sourcePath.name}", ofType: "${this.sourcePath.ext.substr(1)}")!`);
    Reflect.set(this, 'parameterPrefix', options.omitArgumentLabels ? '_ ' : '');
    let moduleFilename = path.join(outDir, `${this.name}.swift`);
    let writtenModuleFile = false;  
    for(let file of this.files) {
        let filename = `${path.join(outDir, path.relative(this.sourceRoot, file.path.dir), file.path.base.substr(0, file.path.base.indexOf('.')))}.swift`;
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
})

decorate(ClassDeclaration, ({prototype}) => prototype.suffix = function (this: ast.ClassDeclaration): string {
    return `: Equatable${this.isThrown ? ', Error' : ''}`;
})

decorate(ClassDeclaration, ({prototype}) => prototype.footer = function (this: ast.ClassDeclaration): string {
    return `}    

public func ==(lhs: ${this.declarationName()}, rhs: ${this.declarationName()}) -> Bool { 
    return lhs as AnyObject === rhs as AnyObject`;
})

decorate(NamespaceDeclaration, ({prototype}) => prototype.keyword = function (this: NamespaceDeclaration): string {
    return "struct";
})

decorate(InterfaceDeclaration, ({prototype}) => prototype.keyword = function (this: ast.InterfaceDeclaration): string {
    return "protocol";
})

decorate(InterfaceDeclaration, ({prototype}) => prototype.suffix = function (this: ast.InterfaceDeclaration): string {
    return ": class";
})

decorate(VariableDeclaration, ({prototype}) => prototype.emit = function (this: ast.VariableDeclaration, indent?: string): string {
    return `${indent}${this.parent instanceof ast.InterfaceDeclaration ? '' : 'public '}${this.isStatic && this.parent != this.sourceFile ? 'static ' : ''}${this.isConstant ? 'let' : 'var'} ${this.name} :${this.type.emit()} ${this.body(indent)}\n`;
})

decorate(ParameterDeclaration, ({prototype}) => prototype.emit = function (this: ast.ParameterDeclaration): string {
    return `${this.module.parameterPrefix}${this.declarationName()}: ${this.type.emit()}${this.isOptional ? `${this.type.isOptional ? '' : '?'} = nil` : ''}`;
})

decorate(FunctionDeclaration, ({prototype}) => prototype.prefix = function (this: ast.FunctionDeclaration): string {
    return `${this.parent instanceof InterfaceDeclaration ? '' : 'public '}${this.isStatic && this.parent != this.sourceFile ? 'static ' : ''}func`;
})

decorate(FunctionDeclaration, ({prototype}) => prototype.suffix = function (this: ast.FunctionDeclaration): string {
    return `${this.signature.returnType instanceof VoidType ? '' : ` -> ${this.signature.returnType.emit()}`}${this.signature.thrownTypes.length ? ' throws' : ''}`;
})

decorate(ConstructorDeclaration, ({prototype}) => prototype.prefix = function (this: ast.ConstructorDeclaration): string {
    return `public`;
})

decorate(ConstructorDeclaration, ({prototype}) => prototype.declarationName = function (this: ast.ConstructorDeclaration): string {
    return `init`;
})

decorate(ConstructorDeclaration, ({prototype}) => prototype.suffix = function (this: ast.ConstructorDeclaration): string {
    return this.signature.thrownTypes.length ? ' throws' : '';
})

decorate(Type, ({prototype}) => prototype.emit = function(this: ast.Type, optional: boolean = this.isOptional): string {
    return `${this.typeName()}${optional ? '?' : ''}`;    
})

decorate(AnyType, ({prototype}) => prototype.typeName = function(this: ast.AnyType): string {
    return 'Any';  
})

decorate(BooleanType, ({prototype}) => prototype.typeName = function(this: ast.BooleanType): string {
    return 'Bool';    
})

decorate(StringType, ({prototype}) => prototype.typeName = function(this: ast.StringType): string {
    return 'String'    
})

decorate(NumberType, ({prototype}) => prototype.typeName = function(this: ast.NumberType): string {
    return 'Double'    
})

decorate(DateType, ({prototype}) => prototype.typeName = function(this: ast.DateType): string {
    return 'Date';  
})

decorate(VoidType, ({prototype}) => prototype.typeName = function(this: ast.VoidType): string {
    return 'Void';  
})

decorate(ArrayType, ({prototype}) => prototype.typeName = function(this: ast.ArrayType): string {
    return `[${this.typeArguments[0].emit()}]`;    
})

decorate(FunctionType, ({prototype}) => prototype.typeName = function(this: ast.FunctionType): string {
    return `(${this.signature.parameters.map(p => `${p.declarationName()}: ${p.type.emit()}`).join(', ')}) -> ${this.signature.returnType.emit()}`; 
})
