import * as path from 'path';
import {readFileSync} from 'fs';
import "./cpp"
import {CppOptions} from "./cpp"
import {decorate} from '../decorator';
import {
    Module, SourceFile, Type, VoidType, AnyType, ArrayType, Declaration, VariableDeclaration, ClassDeclaration, InterfaceDeclaration, FunctionDeclaration, DeclaredType, ParameterDeclaration, ConstructorDeclaration, FunctionType
} from "../ast"


declare module "../ast" {
    interface Declaration {
        accessor(): string
        thisName(): string
    }    
    
    interface Type {
        toNativeValue(accessor: string, indent?: string): string
        genericToNativeValue(optional?: boolean): string
        fromNativeValue(argumentName: string): string
        genericFromNativeValue(optional?: boolean): string
    }
}

decorate(Module, ({prototype}) => prototype.emitWrapper = function (this: Module, outDir: string, options: CppOptions, writeFile: (filename: string, data: string) => void): void {
    // writeFile(path.join(outDir, 'js.h'), readFileSync(path.join(__dirname, 'chakracore.h'), 'utf8'));
    // writeFile(path.join(outDir, 'js.cpp'), readFileSync(path.join(__dirname, 'chakracore.cpp'), 'utf8'));
})

decorate(SourceFile, ({prototype}) => prototype.includes = function (this: SourceFile): string {
    return `#include <jsrt.h>\n`;
})

decorate(SourceFile, ({prototype}) => prototype.footer = function (this: SourceFile): string {
    if(!this.isModuleFile) return '';
    const identifiers = new Map<string, Declaration>();
    [...this.module.allDeclarations()].filter(d => d.parent && !(d instanceof ConstructorDeclaration)).forEach(d => identifiers.set(d.name, d)); 
    return `
extension JSProperty {
    ${[...identifiers.values()].map(d => `static let ${d.declarationName()}: JSProperty = "${d.name}"`).join('\n    ')}
}`.substr(1);
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
    let args = this.signature.parameters.map(p => p.type.fromNativeValue());
    return `try${this.signature.thrownTypes.length ? '' : '!'} this[.${this.declarationName()}]${this.isStatic ? '(' : `.call(proxy${args.length ? `, args: ` : ''}`}${args.join(', ')})`;
})

decorate(FunctionDeclaration, ({prototype}) => prototype.body = function (this: FunctionDeclaration, indent?: string): string {
    let body = `${indent}    ${this.signature.returnType instanceof VoidType ? `_ = ${this.accessor()}` : `return ${this.signature.returnType.toNativeValue()}`}`;
    let thrownDeclaredTypes: DeclaredType[] = this.signature.thrownTypes.filter(t => t instanceof DeclaredType) as DeclaredType[];
    if(thrownDeclaredTypes.length) {
        body = `
${indent}    do {
    ${body}
${indent}    } catch let error as JSError {
${indent}        throw ${thrownDeclaredTypes[0].typeName()}(error.exception)
${indent}    }`.substr(1); 
    }
    return `{
${body}
${indent}}`        
})

decorate(ConstructorDeclaration, ({prototype}) => prototype.body = function (this: ConstructorDeclaration, indent?: string): string {
    let members = this.parent.declarations.filter(m => !m.isStatic && m.constructor.name === 'FunctionDeclaration');
    return `{
${indent}    self.this = try! ${this.thisName()}.construct(${this.signature.parameters.map(p => p.type.fromNativeValue()).join(', ')}) 
${indent}    self.proxy = ${members.length == 0 ? 'this' : `type(of: self) === ${this.parent.declarationName()}.self ? this : JSObject(this.context, prototype: this, callbacks: [ 
${members.map((m: FunctionDeclaration) => `
${indent}        "${m.name}": { args in ${m.signature.returnType instanceof VoidType ? `
${indent}            self.${m.declarationName()}(${m.signature.parameters.map((p, i) => `${p.declarationName()}: ${p.type.toNativeValue(`args[${i}]`)}`).join(', ')}) 
${indent}            return nil` :  `
${indent}            return self.${m.signature.returnType.fromNativeValue(`self.${m.declarationName()}(${m.signature.parameters.map((p, i) => `${p.declarationName()}: ${p.type.toNativeValue(`args[${i}]`)}`).join(', ')})`)}`}
${indent}        }`).join(', ').substr(1)} 
${indent}    ])`} 
${indent}    this.bind(self) 
${indent}}`;        
})

decorate(VariableDeclaration, ({prototype}) => prototype.accessor = function (this: VariableDeclaration) {
    return `${this.isStatic ? 'this' : 'proxy'}[.${this.declarationName()}]`
})

decorate(VariableDeclaration, ({prototype}) => prototype.body = function (this: VariableDeclaration, indent?: string) { 
    return this.isConstant ? `= ${this.type.toNativeValue()}` : 
`{
${indent}    get {
${indent}        ${this.type instanceof FunctionType ? '': 'return '}${this.type.toNativeValue(this.accessor(), `${indent}    `)}
${indent}    }
${indent}    set {
${indent}        ${this.isStatic ? 'this' : 'proxy'}[.${this.declarationName()}] = ${this.type.fromNativeValue()}
${indent}    }
${indent}}`        
})

decorate(ClassDeclaration, ({prototype}) => prototype.header = function (this: ClassDeclaration): string {
    return `
    private static var this: JSClass { 
        get { return ${this.module.name}.this["${this.name}"] } 
    } 
     
    private let this: JSInstance
    private var proxy: JSInstance!
    
    init(_ instance: JSInstance) { 
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
${this.declarations.reduce((out, m) => 
        `${out}"${m.name}": { args in
                self.${m.declarationName()}()
                return nil
            }`, '            ')}    
        ])
    }
}

class JS_${this.declarationName()}: ${this.declarationName()} {
    
    private let this: JSInstance
    
    init(_ instance: JSInstance) {
        this = instance
        this.bind(self)
    }
    
    deinit {
        this.unbind(self)
    }
${this.declarations.reduce((out, m) => `${out}
    func ${m.declarationName()}() {
        _ = try! this[.${m.declarationName()}]()
    }
`, '')}`;
})

decorate(AnyType, ({prototype}) => prototype.toNativeValue = function(this: AnyType, accessor: string = this.declaration.accessor()) {
    return !this.isOptional ? `${accessor}.infer()` : `Any?(${accessor}, wrapped: { $0.infer() })`;    
})

decorate(ArrayType, ({prototype}) => prototype.toNativeValue = function(this: ArrayType, accessor: string = this.declaration.accessor()) {
    return `${this.emit()}(${accessor}, ${this.isOptional ? `wrapped: ${this.genericToNativeValue(false)}` : `element: ${this.typeArguments[0].genericToNativeValue()}`})`
})

decorate(DeclaredType, ({prototype}) => prototype.toNativeValue = function(this: DeclaredType, accessor: string = this.declaration.accessor()): string {
    return `${this.isAbstract ? 'JS_' : ''}${Type.prototype.toNativeValue.call(this, accessor)}`;    
})

decorate(Type, ({prototype}) => prototype.toNativeValue = function(this: Type, accessor: string = this.declaration.accessor()) {
    return `${this.emit()}(${accessor}${this.isOptional ? `, wrapped: ${this.emit(false)}.init` : ''})`;
})

decorate(FunctionType, ({prototype}) => prototype.toNativeValue = function(this: FunctionType, accessor: string = this.declaration.accessor(), indent?: string) {
    return `let function: JSFunction = ${accessor}
${indent}    return { () in return ${this.signature.returnType.emit()}(try! function.call(${this.declaration.thisName()})) }`;    
})

decorate(AnyType, ({prototype}) => prototype.genericToNativeValue = function(this: AnyType, optional: boolean = this.isOptional) {
    return !optional ? `JSValue.infer` : `{ Any?($0, wrapped: JSValue.infer) }`;    
})

decorate(ArrayType, ({prototype}) => prototype.genericToNativeValue = function(this: ArrayType, optional: boolean = this.isOptional) {
    return `{ ${this.emit(optional)}($0, element: ${this.typeArguments[0].genericToNativeValue()}) }`;    
})

decorate(Type, ({prototype}) => prototype.genericToNativeValue = function(this: Type, optional: boolean = this.isOptional) {
    return !optional ? `${this.emit(optional)}.init` : `{ ${this.emit(optional)}($0, wrapped: ${this.emit(false)}.init) }`;    
})

decorate(Type, ({prototype}) => prototype.fromNativeValue = function(this: Type, argumentName: string = this.declaration.argumentName()) {
    return `${this.declaration.thisName()}.valueOf(${argumentName}${this.isOptional ? `, wrapped: ${this.genericFromNativeValue()})` : `)`}`;    
})

decorate(DeclaredType, ({prototype}) => prototype.fromNativeValue = function(this: DeclaredType, argumentName: string = this.declaration.argumentName()) {
    return `${this.declaration.thisName()}.valueOf(${argumentName}${this.isOptional ? `, wrapped: ${this.genericFromNativeValue()})` : `)`}`;    
})

decorate(ArrayType, ({prototype}) => prototype.fromNativeValue = function(this: ArrayType, argumentName: string = this.declaration.argumentName()) {
    return this.isOptional ? Type.prototype.fromNativeValue.call(this) : 
        `${this.declaration.thisName()}.valueOf(${argumentName}, element: ${this.typeArguments[0].genericFromNativeValue()})`;    
})

decorate(DeclaredType, ({prototype}) => prototype.fromNativeValue = function(this: DeclaredType, argumentName: string = this.declaration.argumentName()) {
    return this.isOptional || !this.isAbstract ? Type.prototype.fromNativeValue.call(this) : 
        `${this.declaration.thisName()}.valueOf(${argumentName}, with: ${argumentName}.eval)`;    
})

decorate(FunctionType, ({prototype}) => prototype.fromNativeValue = function(this: FunctionType, argumentName: string = this.declaration.argumentName()) {
    return `JSObject(${this.declaration.thisName()}.context, callback: { args in return ${this.declaration.thisName()}.valueOf(${argumentName}()) })`;    
})

decorate(Type, ({prototype}) => prototype.genericFromNativeValue = function(this: Type) {
    return `${this.declaration.thisName()}.valueOf`;    
})

decorate(ArrayType, ({prototype}) => prototype.genericFromNativeValue = function(this: ArrayType) {
    return `{ ${this.declaration.thisName()}.valueOf($0, element: ${this.typeArguments[0].genericFromNativeValue()}) }`;    
})

decorate(DeclaredType, ({prototype}) => prototype.genericFromNativeValue = function(this: DeclaredType) {
    return !this.isAbstract ? Type.prototype.fromNativeValue.call(this) : 
        `{ ${this.declaration.thisName()}.valueOf($0, with: ${this.declaration.argumentName()}.eval) }`;    
})
