import "./swift"
import {decorate} from '../decorator';
import {
    Module, SourceFile, Type, VoidType, AnyType, BooleanType, StringType, NumberType, ErrorType, ArrayType, Declaration, VariableDeclaration, TypeDeclaration, ClassDeclaration, InterfaceDeclaration, FunctionDeclaration, MemberDeclaration, DeclaredType, ParameterDeclaration, ConstructorDeclaration, FunctionType
} from "../ast"


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

decorate(SourceFile, ({prototype}) => prototype.header = function (this: SourceFile): string {
    return `import Foundation\n${!this.isModuleFile  ? '' : `\nvar this :JSInstance = try! JSContext().eval(${this.module.resourcePath})`}`;
})

decorate(SourceFile, ({prototype}) => prototype.footer = function (this: SourceFile): string {
    return `
${this.declarations.filter(d => d instanceof InterfaceDeclaration).reduce((out: string, i: InterfaceDeclaration) => `${out}
extension ${i.declarationName()} {
    func eval(context: JSContext) -> JSValue {
        return JSObject(context, callbacks: [
${i.members.reduce((out, m) => `${out}
            "${m.name}": { args in
                self.${m.declarationName()}()
                return nil
            }`, '')}    
        ])
    }
}

class JS_${i.declarationName()} : ${i.declarationName()} {
    
    private let this :JSInstance;
    
    init(_ instance :JSInstance) {
        this = instance
        this.bind(self)
    }
    
    deinit {
        this.unbind(self)
    }
    
${i.members.reduce((out, m) => `${out}
    func ${m.declarationName()}() {
        try! this[.${m.declarationName()}]();
    }
`, '').substr(1)}    
}
`, '')}${!this.isModuleFile ? '' : `
extension JSProperty {
    ${this.module.identifiers.map((d) => `static let ${d.declarationName()}: JSProperty = "${d.name}"`).join('\n    ')}
}`.substr(1)}`.substr(1);
})

decorate(Declaration, ({prototype}) => prototype.argumentName = function (this: Declaration): string {
    return this.declarationName();
})

decorate(FunctionDeclaration, ({prototype}) => prototype.accessor = function (this: FunctionDeclaration): string {
    return `try${this.signature.thrownTypes.length ? '' : '!'} this[.${this.declarationName()}](${this.signature.parameters.map(p => p.type.argumentValue()).join(', ')})`;
})

decorate(FunctionDeclaration, ({prototype}) => prototype.body = function (this: FunctionDeclaration, indent?: string): string {
    return `{
${indent}    ${this.signature.returnType instanceof VoidType ? this.accessor() : `return ${this.signature.returnType.returnValue()}`}
${indent}}`;
})

decorate(FunctionDeclaration, ({prototype}) => prototype.body = function (this: FunctionDeclaration, indent?: string): string {
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
})

decorate(ConstructorDeclaration, ({prototype}) => prototype.body = function (this: ConstructorDeclaration, indent?: string): string {
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
})

decorate(VariableDeclaration, ({prototype}) => prototype.argumentName = function (this: VariableDeclaration) {
    return `newValue`;
})

decorate(VariableDeclaration, ({prototype}) => prototype.accessor = function (this: VariableDeclaration) {
    return `this[.${this.declarationName()}]`
})

decorate(VariableDeclaration, ({prototype}) => prototype.body = function (this: VariableDeclaration, indent?: string) { 
    return this.constant ? `= ${this.type.returnValue()}` : 
`{
${indent}    get {
${indent}        ${this.type instanceof FunctionType ? '': 'return '}${this.type.returnValue(`${indent}    `)}
${indent}    }
${indent}    set {
${indent}        this[.${this.declarationName()}] = ${this.type.argumentValue()}
${indent}    }
${indent}}`        
})


decorate(TypeDeclaration, ({prototype}) => prototype.header = function (this: TypeDeclaration, indent?: string): string {
    return "";
})

decorate(TypeDeclaration, ({prototype}) => prototype.footer = function (this: TypeDeclaration, indent?: string): string {
    return "";
})

decorate(AnyType, ({prototype}) => prototype.returnValue = function(this: AnyType) {
    return !this.optional ? `${this.parent.accessor()}.infer()` : `Any?(${this.parent.accessor()}, wrapped: { $0.infer() })`;    
})

decorate(ArrayType, ({prototype}) => prototype.returnValue = function(this: ArrayType) {
    return `${this.emit()}(${this.parent.accessor()}, ${this.optional ? `wrapped: ${this.arrayElementReturnValue(false)}` : `element: ${this.typeArguments[0].arrayElementReturnValue()}`})`
})

decorate(Type, ({prototype}) => prototype.returnValue = function(this: Type) {
    return `${this.emit()}(${this.parent.accessor()}${this.optional ? `, wrapped: ${this.emit(false)}.init` : ''})`;
})

decorate(AnyType, ({prototype}) => prototype.arrayElementReturnValue = function(this: AnyType, optional: boolean = this.optional) {
    return !optional ? `JSValue.infer` : `{ Any?($0, wrapped: JSValue.infer) }`;    
})

decorate(ArrayType, ({prototype}) => prototype.arrayElementReturnValue = function(this: ArrayType, optional: boolean = this.optional) {
    return `{ ${this.emit(optional)}($0, element: ${this.typeArguments[0].arrayElementReturnValue()}) }`;    
})

decorate(Type, ({prototype}) => prototype.arrayElementReturnValue = function(this: Type, optional: boolean = this.optional) {
    return !optional ? `${this.emit(optional)}.init` : `{ ${this.emit(optional)}($0, wrapped: ${this.emit(false)}.init) }`;    
})

decorate(Type, ({prototype}) => prototype.argumentValue = function(this: Type) {
    return `this.valueOf(${this.parent.argumentName()}${this.optional ? `, wrapped: ${this.arrayElementArgumentValue()})` : `)`}`;    
})

decorate(ArrayType, ({prototype}) => prototype.argumentValue = function(this: ArrayType) {
    return this.optional ? Type.prototype.argumentValue.call(this, this.parent) : 
        `this.valueOf(${this.parent.argumentName()}, element: ${this.typeArguments[0].arrayElementArgumentValue()})`;    
})

decorate(Type, ({prototype}) => prototype.arrayElementArgumentValue = function(this: Type) {
    return `this.valueOf`;    
})

decorate(ArrayType, ({prototype}) => prototype.arrayElementArgumentValue = function(this: ArrayType) {
    return `{ this.valueOf($0, element: ${this.typeArguments[0].arrayElementArgumentValue()}) }`;    
})

decorate(FunctionType, ({prototype}) => prototype.argumentValue = function(this: FunctionType) {
    return `JSObject(this.context, callback: { args in return this.valueOf(${this.parent.argumentName()}()) })`;    
})

decorate(FunctionType, ({prototype}) => prototype.returnValue = function(this: FunctionType, indent?: string) {
    return `let function :JSFunction = this[.${this.parent.declarationName()}]
${indent}    return { () in return ${this.signature.returnType.emit()}(try! function.call(this)) }`;    
})
