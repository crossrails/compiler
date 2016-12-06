import * as path from 'path';
import * as ast from "../ast"
import {decorate} from '../decorator';
import {EmitterOptions} from "../emitter" 
import {
    Module, Type, VoidType, AnyType, BooleanType, StringType, NumberType, ArrayType, VariableDeclaration, ClassDeclaration, InterfaceDeclaration, FunctionDeclaration, ParameterDeclaration, ConstructorDeclaration, FunctionType, DateType, NamespaceDeclaration, SourceFile
} from "../ast"

export interface CppOptions extends EmitterOptions {
    chakracore?: EmitterOptions 
}

declare module "../ast" {
    interface Module {
        resourcePath: string
        parameterPrefix: string
    }

    interface SourceFile {
        includes(): string
    }

    interface VariableDeclaration {
        body(indent?: string): string
    }
}
 
decorate(Module, ({prototype}) => prototype.emit = function (this: ast.Module, outDir: string, options: CppOptions, writeFile: (filename: string, data: string) => void): void {
    let moduleFilename = path.join(outDir, `${this.name}.h`);
    let writtenModuleFile = false;  
    for(let file of this.files) {
        let filename = `${path.join(outDir, path.relative(this.sourceRoot, file.path.dir), file.path.base.substr(0, file.path.base.indexOf('.')))}.h`;
        Object.defineProperty(file, 'isModuleFile', { writable: false, value: filename == moduleFilename});
        Object.defineProperty(file, 'imports', { writable: false, value: file.requiredImports.map(i => options.imports && options.imports[i.index] && options.imports[i.index] != '*' ? options.imports[i.index] : i.default.replace(/\..*/, '')) });
        writeFile(filename, file.emit());                
        writtenModuleFile = writtenModuleFile || file.isModuleFile;
    }        
    if(!writtenModuleFile) {
        let file: ast.SourceFile = Object.create(ast.SourceFile.prototype, {
            isModuleFile: { value: true},
            imports: { value: [] },
            module: { value: this },
            name: { value: this.name },
            declarations: { value: [] },
        });
        writeFile(moduleFilename, file.emit());
    }
})

decorate(SourceFile, ({prototype}) => prototype.header = function (this: SourceFile): string {
    return `#include <optional>\n\n${this.includes()}${this.imports.reduce((out, name) => `#include "${name}"\n`, '')}\nusing namespace std;\n`;
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
    return "namespace";
})

decorate(InterfaceDeclaration, ({prototype}) => prototype.keyword = function (this: ast.InterfaceDeclaration): string {
    return "class";
})

decorate(VariableDeclaration, ({prototype}) => prototype.emit = function (this: VariableDeclaration, indent?: string): string {
    let name = `${this.declarationName().charAt(0).toUpperCase()}${this.declarationName().slice(1)}`;
    return `
${indent}${this.parent == this.sourceFile ? '' : `${this.isProtected ? 'protected ' : 'public '}${this.isStatic ? 'static ' : ''}` }${this.isAbstract ? 'virtual ' : ''}${this.type.emit()} get${name}();
    ${this.isConstant ? '' : `
${indent}${this.parent == this.sourceFile ? '' : `${this.isProtected ? 'protected ' : 'public '}${this.isStatic ? 'static ' : ''}` }${this.isAbstract ? 'virtual ' : ''}void set${name}(${this.type.emit(false)} ${this.name});
    `}`.substr(1);
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
    return optional ? `optional<${this.typeName()}>` : this.typeName();    
})

decorate(AnyType, ({prototype}) => prototype.typeName = function(this: ast.AnyType): string {
    return 'any';  
})

decorate(BooleanType, ({prototype}) => prototype.typeName = function(this: ast.BooleanType): string {
    return 'bool';    
})

decorate(StringType, ({prototype}) => prototype.typeName = function(this: ast.StringType): string {
    return 'wstring'    
})

decorate(NumberType, ({prototype}) => prototype.typeName = function(this: ast.NumberType): string {
    return 'double'    
})

decorate(DateType, ({prototype}) => prototype.typeName = function(this: ast.DateType): string {
    return 'date';  
})

decorate(VoidType, ({prototype}) => prototype.typeName = function(this: ast.VoidType): string {
    return 'void';  
})

decorate(ArrayType, ({prototype}) => prototype.typeName = function(this: ast.ArrayType): string {
    return `vector<${this.typeArguments[0].emit()}>`;    
})

decorate(FunctionType, ({prototype}) => prototype.typeName = function(this: ast.FunctionType): string {
    return `(${this.signature.parameters.map(p => `${p.declarationName()}: ${p.type.emit()}`).join(', ')}) -> ${this.signature.returnType.emit()}`; 
})
