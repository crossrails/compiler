import "./swift"

import {Module, SourceFile, Type, VoidType, AnyType, ArrayType, Declaration, VariableDeclaration, TypeDeclaration, ClassDeclaration, InterfaceDeclaration, FunctionDeclaration, MemberDeclaration, DeclaredType, ParameterDeclaration, ConstructorDeclaration, FunctionType} from "../ast"

declare module "../ast" {
    interface Type {
        arrayElementReturnValue(optional?: boolean): string;
        returnValue(): string;
        argumentValue(): string;
        arrayElementArgumentValue(): string;
    }
}

SourceFile.prototype.header = function (this: SourceFile): string {
    return `import Foundation${!this.isModuleFile  ? '' : `\n\nvar this :JSInstance = try! JSContext().eval(${this.module.resourcePath})`}\n\n`;
}

SourceFile.prototype.footer = function (this: SourceFile): string {
    return !this.isModuleFile ? '' : `
extension JSProperty {
    ${this.module.identifiers.map((id) => `static let ${id}: JSProperty = "${id}"`).join('\n\t')}
}`
}

FunctionDeclaration.prototype.body = function (this: FunctionDeclaration, indent?: string): string {
    return `{
        
}`        
}


VariableDeclaration.prototype.body = function (this: VariableDeclaration, indent?: string) {
    return this.constant ? `= ${this.type.returnValue()}` : 
`{
    get {
        return ${this.type.returnValue()}
    }
    set {
        this[.${this.declarationName()}] = ${this.type.argumentValue()}
    }
}`        
}

TypeDeclaration.prototype.header = function (this: TypeDeclaration, indent?: string): string {
    return "";
}

TypeDeclaration.prototype.footer = function (this: TypeDeclaration, indent?: string): string {
    return "";
}


AnyType.prototype.returnValue = function(this: AnyType) {
    return !this.optional ? `this[.${this.parent.declarationName()}].infer()` : `Any?(this[.${this.parent.declarationName()}], wrapped: { $0.infer() })`;    
}

ArrayType.prototype.returnValue = function(this: ArrayType) {
    return this.optional ? `${this.emit()}(this[.${this.parent.declarationName()}], wrapped: ${this.arrayElementReturnValue(false)})` : 
        `${this.emit()}(this[.${this.parent.declarationName()}], element: ${this.typeArguments[0].arrayElementReturnValue()})`; 
}

Type.prototype.returnValue = function(this: Type) {
    return !this.optional ? `${this.emit()}(this[.${this.parent.declarationName()}])` : 
        `${this.emit()}(this[.${this.parent.declarationName()}], wrapped: ${this.emit(false)}.init)`;    
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
    return `this.valueOf(newValue${this.optional ? `, wrapped: ${this.arrayElementArgumentValue()})` : `)`}`;    
}

ArrayType.prototype.argumentValue = function(this: ArrayType) {
    return this.optional ? Type.prototype.argumentValue.call(this, this.parent) : 
        `this.valueOf(newValue, element: ${this.typeArguments[0].arrayElementArgumentValue()})`;    
}

Type.prototype.arrayElementArgumentValue = function(this: Type) {
    return `this.valueOf`;    
}

ArrayType.prototype.arrayElementArgumentValue = function(this: ArrayType) {
    return `{ this.valueOf($0, element: ${this.typeArguments[0].arrayElementArgumentValue()}) }`;    
}
