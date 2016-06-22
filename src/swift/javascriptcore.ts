import "./swift"

import {Module, SourceFile, Type, VoidType, AnyType, ArrayType, Declaration, VariableDeclaration, TypeDeclaration, ClassDeclaration, InterfaceDeclaration, FunctionDeclaration, MemberDeclaration, DeclaredType, ParameterDeclaration, ConstructorDeclaration, FunctionType} from "../ast"

declare module "../ast" {
    interface Declaration {
        accessor(): string
        argumentName(): string;
    }    
    
    interface Type {
        arrayElementReturnValue(optional?: boolean): string;
        returnValue(indent?: string): string;
        argumentValue(): string;
        arrayElementArgumentValue(optional?: boolean): string;
    }
}

SourceFile.prototype.header = function (this: SourceFile): string {
    return `import Foundation\n${!this.isModuleFile  ? '' : `\nvar this :JSInstance = try! JSContext().eval(${this.module.resourcePath})`}`;
}

SourceFile.prototype.footer = function (this: SourceFile): string {
    return !this.isModuleFile ? '' : `
extension JSProperty {
    ${this.module.identifiers.map((d) => `static let ${d.declarationName()}: JSProperty = "${d.name}"`).join('\n    ')}
}`.substr(1)
}

Declaration.prototype.argumentName = function (this: Declaration): string {
    return this.declarationName();
}

FunctionDeclaration.prototype.accessor = function (this: FunctionDeclaration): string {
    return `try${this.signature.thrownTypes.length ? '' : '!'} this[.${this.declarationName()}](${this.signature.parameters.map(p => p.type.argumentValue()).join(', ')})`;
}

FunctionDeclaration.prototype.body = function (this: FunctionDeclaration, indent?: string): string {
    return `{
${indent}    ${this.signature.returnType instanceof VoidType ? this.accessor() : `return ${this.signature.returnType.returnValue()}`}
${indent}}`;
}

FunctionDeclaration.prototype.body = function (this: FunctionDeclaration, indent?: string): string {
    let body = `${indent}    ${this.signature.returnType instanceof VoidType ? this.accessor() : `return ${this.signature.returnType.returnValue()}`}`;
    let thrownDeclaredTypes: DeclaredType[] = this.signature.thrownTypes.filter(t => t instanceof DeclaredType) as DeclaredType[];
    if(thrownDeclaredTypes.length) {
        body = `
${indent}    do {
    ${body}
${indent}    } catch let error as Error {
${indent}        throw new ${thrownDeclaredTypes[0].typeName()}(error.exception)
${indent}    }`.substr(1); 
    }
    return `{
${body}
${indent}}`        
}

ConstructorDeclaration.prototype.body = function (this: ConstructorDeclaration, indent?: string): string {
    return `{
${indent}    self.this = try! SimpleObject.this.construct(${this.signature.parameters.map(p => p.type.argumentValue()).join(', ')}) 
${indent}    self.proxy = self.dynamicType === SimpleObject.self ? this : JSObject(this.context, prototype: this, callbacks: [ 
${this.parent.members.filter(m => !m.static && m.constructor.name === 'FunctionDeclaration').map((m: FunctionDeclaration) => `
${indent}        "${m.name}": { args in ${m.signature.returnType instanceof VoidType ? `
${indent}            self.${m.declarationName()}(args) 
${indent}            return null` :  `
${indent}            return self.${m.declarationName()}(args)`}
${indent}        }`).join(', ').substr(1)} 
${indent}    ]) 
${indent}    this.bind(self) 
${indent}}`;        
}

VariableDeclaration.prototype.argumentName = function (this: VariableDeclaration) {
    return `newValue`;
}

VariableDeclaration.prototype.accessor = function (this: VariableDeclaration) {
    return `this[.${this.declarationName()}]`
}

VariableDeclaration.prototype.body = function (this: VariableDeclaration, indent?: string) { 
    return this.constant ? `= ${this.type.returnValue()}` : 
`{
${indent}    get {
${indent}        ${this.type instanceof FunctionType ? '': 'return '}${this.type.returnValue(`${indent}    `)}
${indent}    }
${indent}    set {
${indent}        this[.${this.declarationName()}] = ${this.type.argumentValue()}
${indent}    }
${indent}}`        
}


TypeDeclaration.prototype.header = function (this: TypeDeclaration, indent?: string): string {
    return "";
}

TypeDeclaration.prototype.footer = function (this: TypeDeclaration, indent?: string): string {
    return "";
}

AnyType.prototype.returnValue = function(this: AnyType) {
    return !this.optional ? `${this.parent.accessor()}.infer()` : `Any?(${this.parent.accessor()}, wrapped: { $0.infer() })`;    
}

ArrayType.prototype.returnValue = function(this: ArrayType) {
    return `${this.emit()}(${this.parent.accessor()}, ${this.optional ? `wrapped: ${this.arrayElementReturnValue(false)}` : `element: ${this.typeArguments[0].arrayElementReturnValue()}`})`
}

Type.prototype.returnValue = function(this: Type) {
    return `${this.emit()}(${this.parent.accessor()}${this.optional ? `, wrapped: ${this.emit(false)}.init` : ''})`;
}

AnyType.prototype.arrayElementReturnValue = function(this: AnyType, optional: boolean = this.optional) {
    return !optional ? `JSValue.infer` : `{ Any?($0, wrapped: JSValue.infer) }`;    
}

ArrayType.prototype.arrayElementReturnValue = function(this: ArrayType, optional: boolean = this.optional) {
    return `{ ${this.emit(optional)}($0, element: ${this.typeArguments[0].arrayElementReturnValue()}) }`;    
}

Type.prototype.arrayElementReturnValue = function(this: Type, optional: boolean = this.optional) {
    return !optional ? `${this.emit(optional)}.init` : `{ ${this.emit(optional)}($0, wrapped: ${this.emit(false)}.init) }`;    
}

Type.prototype.argumentValue = function(this: Type) {
    return `this.valueOf(${this.parent.argumentName()}${this.optional ? `, wrapped: ${this.arrayElementArgumentValue()})` : `)`}`;    
}

ArrayType.prototype.argumentValue = function(this: ArrayType) {
    return this.optional ? Type.prototype.argumentValue.call(this, this.parent) : 
        `this.valueOf(${this.parent.argumentName()}, element: ${this.typeArguments[0].arrayElementArgumentValue()})`;    
}

Type.prototype.arrayElementArgumentValue = function(this: Type) {
    return `this.valueOf`;    
}

ArrayType.prototype.arrayElementArgumentValue = function(this: ArrayType) {
    return `{ this.valueOf($0, element: ${this.typeArguments[0].arrayElementArgumentValue()}) }`;    
}

FunctionType.prototype.argumentValue = function(this: FunctionType) {
    return `JSObject(this.context, callback: { args in return this.valueOf(${this.parent.argumentName()}()) })`;    
}

FunctionType.prototype.returnValue = function(this: FunctionType, indent?: string) {
    return `let function :JSFunction = this[.${this.parent.declarationName()}]
${indent}    return { () in return ${this.signature.returnType.emit()}(try! function.call(this)) }`;    
}
