import "./swift"
import {decorate} from '../decorator';
import {
    Module, SourceFile, Type, VoidType, AnyType, BooleanType, StringType, NumberType, ErrorType, ArrayType, Declaration, VariableDeclaration, TypeDeclaration, ClassDeclaration, InterfaceDeclaration, FunctionDeclaration, MemberDeclaration, DeclaredType, ParameterDeclaration, ConstructorDeclaration, FunctionType
} from "../ast"


declare module "../ast" {
    interface Declaration {
        accessor(): string
        argumentName(): string;
        thisName(): string
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
    return `${!this.isModuleFile ? '' : `
extension JSProperty {
    ${this.module.identifiers.map((d) => `static let ${d.declarationName()}: JSProperty = "${d.name}"`).join('\n    ')}
}`.substr(1)}`;
})

decorate(Declaration, ({prototype}) => prototype.argumentName = function (this: Declaration): string {
    return this.declarationName();
})

decorate(Declaration, ({prototype}) => prototype.thisName = function (this: Declaration): string {
    return `this`;
})

decorate(ConstructorDeclaration, ({prototype}) => prototype.thisName = function (this: ConstructorDeclaration): string {
    return `${this.parent.declarationName()}.this`;
})

decorate(ParameterDeclaration, ({prototype}) => prototype.thisName = function (this: ParameterDeclaration): string {
    return this.parent.thisName();
})

decorate(FunctionDeclaration, ({prototype}) => prototype.accessor = function (this: FunctionDeclaration): string {
    let args = this.signature.parameters.map(p => p.type.argumentValue());
    return `try${this.signature.thrownTypes.length ? '' : '!'} this[.${this.declarationName()}]${this.static ? `(${args.join(', ')})` : `.call(${['proxy', ...args].join(', ')})`}`;
})

decorate(FunctionDeclaration, ({prototype}) => prototype.body = function (this: FunctionDeclaration, indent?: string): string {
    let body = `${indent}    ${this.signature.returnType instanceof VoidType ? this.accessor() : `return ${this.signature.returnType.returnValue()}`}`;
    let thrownDeclaredTypes: DeclaredType[] = this.signature.thrownTypes.filter(t => t instanceof DeclaredType) as DeclaredType[];
    if(thrownDeclaredTypes.length) {
        body = `
${indent}    do {
    ${body}
${indent}    } catch let error as Error {
${indent}        throw ${thrownDeclaredTypes[0].typeName()}(error.exception)
${indent}    }`.substr(1); 
    }
    return `{
${body}
${indent}}`        
})

decorate(ConstructorDeclaration, ({prototype}) => prototype.body = function (this: ConstructorDeclaration, indent?: string): string {
    let members = this.parent.members.filter(m => !m.static && m.constructor.name === 'FunctionDeclaration');
    return `{
${indent}    self.this = try! ${this.thisName()}.construct(${this.signature.parameters.map(p => p.type.argumentValue()).join(', ')}) 
${indent}    self.proxy = ${members.length == 0 ? 'this' : `self.dynamicType === ${this.parent.declarationName()}.self ? this : JSObject(this.context, prototype: this, callbacks: [ 
${members.map((m: FunctionDeclaration) => `
${indent}        "${m.name}": { args in ${m.signature.returnType instanceof VoidType ? `
${indent}            self.${m.declarationName()}(args) 
${indent}            return nil` :  `
${indent}            return self.${m.declarationName()}(args)`}
${indent}        }`).join(', ').substr(1)} 
${indent}    ])`} 
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

decorate(ClassDeclaration, ({prototype}) => prototype.header = function (this: ClassDeclaration): string {
    return `
    private static var this :JSClass { 
        get { return ${this.module.name}.this["${this.name}"] } 
    } 
     
    private let this :JSInstance
    private var proxy :JSInstance!
    
    init(_ instance :JSInstance) { 
        this = instance 
        proxy = instance 
        this.bind(self)
    }

    deinit { 
        this.unbind(self)
    }

`.substr(1);
})



decorate(InterfaceDeclaration, ({prototype}) => prototype.footer = function (this: InterfaceDeclaration , indent?: string): string {
    return `}

extension ${this.declarationName()} {
    func eval(_ context: JSContext) -> JSValue {
        return JSObject(context, callbacks: [
${this.members.reduce((out, m) => 
        `${out}"${m.name}": { args in
                self.${m.declarationName()}()
                return nil
            }`, '            ')}    
        ])
    }
}

class JS_${this.declarationName()} : ${this.declarationName()} {
    
    private let this :JSInstance
    
    init(_ instance :JSInstance) {
        this = instance
        this.bind(self)
    }
    
    deinit {
        this.unbind(self)
    }
${this.members.reduce((out, m) => `${out}
    func ${m.declarationName()}() {
        try! this[.${m.declarationName()}]()
    }
`, '')}`;
})

decorate(AnyType, ({prototype}) => prototype.returnValue = function(this: AnyType) {
    return !this.optional ? `${this.parent.accessor()}.infer()` : `Any?(${this.parent.accessor()}, wrapped: { $0.infer() })`;    
})

decorate(ArrayType, ({prototype}) => prototype.returnValue = function(this: ArrayType) {
    return `${this.emit()}(${this.parent.accessor()}, ${this.optional ? `wrapped: ${this.arrayElementReturnValue(false)}` : `element: ${this.typeArguments[0].arrayElementReturnValue()}`})`
})

decorate(DeclaredType, ({prototype}) => prototype.returnValue = function(this: DeclaredType): string {
    return `${this.declaration instanceof InterfaceDeclaration ? 'JS_' : ''}${Type.prototype.returnValue.call(this)}`;    
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
    return `${this.parent.thisName()}.valueOf(${this.parent.argumentName()}${this.optional ? `, wrapped: ${this.arrayElementArgumentValue()})` : `)`}`;    
})

decorate(DeclaredType, ({prototype}) => prototype.argumentValue = function(this: DeclaredType) {
    return `${this.parent.thisName()}.valueOf(${this.parent.argumentName()}${this.optional ? `, wrapped: ${this.arrayElementArgumentValue()})` : `)`}`;    
})

decorate(ArrayType, ({prototype}) => prototype.argumentValue = function(this: ArrayType) {
    return this.optional ? Type.prototype.argumentValue.call(this) : 
        `${this.parent.thisName()}.valueOf(${this.parent.argumentName()}, element: ${this.typeArguments[0].arrayElementArgumentValue()})`;    
})

decorate(DeclaredType, ({prototype}) => prototype.argumentValue = function(this: DeclaredType) {
    return this.optional || !(this.declaration instanceof InterfaceDeclaration) ? Type.prototype.argumentValue.call(this) : 
        `${this.parent.thisName()}.valueOf(${this.parent.argumentName()}, with: ${this.parent.argumentName()}.eval)`;    
})

decorate(Type, ({prototype}) => prototype.arrayElementArgumentValue = function(this: Type) {
    return `${this.parent.thisName()}.valueOf`;    
})

decorate(ArrayType, ({prototype}) => prototype.arrayElementArgumentValue = function(this: ArrayType) {
    return `{ ${this.parent.thisName()}.valueOf($0, element: ${this.typeArguments[0].arrayElementArgumentValue()}) }`;    
})

decorate(DeclaredType, ({prototype}) => prototype.arrayElementArgumentValue = function(this: DeclaredType) {
    return !(this.declaration instanceof InterfaceDeclaration) ? Type.prototype.argumentValue.call(this) : 
        `{ ${this.parent.thisName()}.valueOf($0, with: ${this.parent.argumentName()}.eval) }`;    
})

decorate(FunctionType, ({prototype}) => prototype.argumentValue = function(this: FunctionType) {
    return `JSObject(${this.parent.thisName()}.context, callback: { args in return ${this.parent.thisName()}.valueOf(${this.parent.argumentName()}()) })`;    
})

decorate(FunctionType, ({prototype}) => prototype.returnValue = function(this: FunctionType, indent?: string) {
    return `let function :JSFunction = ${this.parent.thisName()}[.${this.parent.declarationName()}]
${indent}    return { () in return ${this.signature.returnType.emit()}(try! function.call(${this.parent.thisName()})) }`;    
})
