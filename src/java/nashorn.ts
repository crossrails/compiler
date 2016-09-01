import * as path from 'path';
import {readFileSync} from 'fs';
import "./java"
import {JavaOptions} from "./java"
import {decorate} from '../decorator';

import {Module, SourceFile, Type, VoidType, AnyType, ArrayType, Declaration, VariableDeclaration, ClassDeclaration, InterfaceDeclaration, FunctionDeclaration, DeclaredType, ParameterDeclaration, ConstructorDeclaration, FunctionType} from "../ast"

declare module "../ast" {
    interface Declaration {
        accessor(): string
        mirror(): string
    }

    interface Type {
        genericToNativeValue(optional?: boolean): string;
        toNativeValue(): string;
        fromNativeValue(): string;
        genericFromNativeValue(optional?: boolean): string;
    }
}

decorate(Module, ({prototype}) => prototype.emitWrapper = function (this: Module, outDir: string, options: JavaOptions, writeFile: (filename: string, data: string) => void): void {
    outDir = path.join(outDir, options.basePackage.replace('.', path.sep));
    writeFile(path.join(outDir, 'JS.java'), readFileSync(path.join(__dirname, 'nashorn.java'), 'utf8'));
})

decorate(InterfaceDeclaration, ({prototype}) => prototype.imports = function (this: InterfaceDeclaration) {      
    return `import java.util.*;`
})

decorate(InterfaceDeclaration, ({prototype}) => prototype.header = function (this: InterfaceDeclaration, indent?: string) {
    return '';
})

decorate(InterfaceDeclaration, ({prototype}) => prototype.footer = function (this: InterfaceDeclaration, indent?: string) {
    return '';
})

decorate(Declaration, ({prototype}) => prototype.imports = function (this: Declaration) {
    return `
import java.util.*;
import java.util.function.*;
import jdk.nashorn.api.scripting.*;${
    this.sourceFile.isModuleFile ? '' : `\n
import static io.xrails.${this.module.name.charAt(0).toUpperCase()}${this.module.name.slice(1)}.global;`
    }`.substr(1);
})

decorate(ClassDeclaration, ({prototype}) => prototype.header = function (this: ClassDeclaration, indent?: string) {
    return `
${!this.sourceFile.isModuleFile ? '' : `
${indent}static final ScriptObjectMirror global = JS.eval("${this.module.sourcePath.base}");`.substr(1)
}${!this.declarations.some(m => m.parent != m.sourceFile) ? '' : `
${indent}private static final ScriptObjectMirror classMirror = (ScriptObjectMirror)global.get("${this.name}");\n`.substr(1)
}${!this.declarations.some(m => !m.isStatic) ? '' : `
${indent}private final ScriptObjectMirror prototype;
${indent}private final JSObject mirror;

${indent}${this.declarationName()}(ScriptObjectMirror mirror) { 
${indent}    this.prototype = mirror; 
${indent}    this.mirror = mirror; 
${indent}    JS.heap.put(this, mirror);
${indent}}

`}`.substr(1);    
})

decorate(ClassDeclaration, ({prototype}) => prototype.footer = function (this: ClassDeclaration, indent?: string) {
    return !this.declarations.some(m => !m.isStatic) ? '' : `
${indent}@Override
${indent}public String toString() {
${indent}    return mirror.toString();
${indent}}

${indent}@Override
${indent}public int hashCode() {
${indent}    return mirror.hashCode();
${indent}}

${indent}@Override
${indent}public boolean equals(Object obj) {
${indent}    return mirror.equals(JS.heap.getOrDefault(obj, obj));
${indent}}`;
})

decorate(Declaration, ({prototype}) => prototype.mirror = function (this: Declaration) {
    return this.parent == this.sourceFile ? 'global' : this.isStatic ? 'classMirror' : 'prototype';        
})

decorate(VariableDeclaration, ({prototype}) => prototype.accessor = function (this: VariableDeclaration) {
    return `${this.mirror()}.get("${this.declarationName()}")`
})

decorate(VariableDeclaration, ({prototype}) => prototype.getter = function (this: VariableDeclaration, indent?: string) {
    let returnValue = this.type.optional ? `Optional.ofNullable(${this.type.toNativeValue()})` : this.type.toNativeValue();
    return `{
${indent}    return ${returnValue};
${indent}}`;        
})

decorate(VariableDeclaration, ({prototype}) => prototype.setter = function (this: VariableDeclaration, indent?: string) {
    return `{
${indent}    ${this.mirror()}.setMember("${this.declarationName()}", ${this.type.fromNativeValue()});
${indent}}`;        
})

decorate(FunctionDeclaration, ({prototype}) => prototype.accessor = function (this: FunctionDeclaration): string {
    let args = this.signature.parameters.map(p => p.type.fromNativeValue());
    return this.isStatic ? `${this.mirror()}.callMember(${[`"${this.declarationName()}"`, ...args].join(', ')})` : `((JSObject)prototype.getMember("${this.declarationName()}")).call(${[`mirror`, ...args].join(', ')})`;
})

decorate(FunctionDeclaration, ({prototype}) => prototype.body = function (this: FunctionDeclaration, indent?: string): string {
    let body = `${indent}    ${this.signature.returnType instanceof VoidType ? this.accessor() : `return ${this.signature.returnType.toNativeValue()}`};`;
    let thrownDeclaredTypes: DeclaredType[] = this.signature.thrownTypes.filter(t => t instanceof DeclaredType) as DeclaredType[];
    if(thrownDeclaredTypes.length) {
        body = `
${indent}    try {
    ${body}
${indent}    } catch (NashornException e) {
${indent}        ScriptObjectMirror mirror = (ScriptObjectMirror)e.getEcmaError();
${indent}        Object constructor = mirror.get("constructor");
${indent}        if(constructor instanceof ScriptObjectMirror) {
${indent}            Object name = ((ScriptObjectMirror)constructor).get("name");
${indent}            if(name instanceof String) switch ((String)name) {${
                         thrownDeclaredTypes.reduce((out, type) => `
${out}${indent}                case "${type.name!}":
${indent}                    throw new ${type.typeName()}((ScriptObjectMirror)e.getEcmaError());`, '')}
${indent}            }
${indent}        }
${indent}        throw e;
${indent}    }`; 
    }
    return `{
${body}
${indent}}`        
})

decorate(ConstructorDeclaration, ({prototype}) => prototype.body = function (this: ConstructorDeclaration, indent?: string): string {
    return `{
${indent}    prototype = (ScriptObjectMirror)classMirror.newObject(${this.signature.parameters.map(p => p.type.fromNativeValue()).join(', ')}); 
${indent}    mirror = getClass() == ${this.parent.declarationName()}.class ? prototype : new JS.AbstractMirror(prototype) { 
${indent}        @Override 
${indent}        void build(BiConsumer<String, Function<Object[], Object>> builder) { 
${this.parent.declarations.filter(m => !m.isStatic && m.constructor.name === 'FunctionDeclaration').map((m: FunctionDeclaration) => `
${indent}            builder.accept("${m.name}", args -> ${m.signature.returnType instanceof VoidType ? 
                     `{ ${m.declarationName()}(${m.signature.parameters.map((p, i) => `(${p.type.typeName()})args[${i}]`).join(', ')}); return null; }` : 
                     `${m.declarationName()}(${m.signature.parameters.map((p, i) => `(${p.type.typeName()})args[${i}]`).join(', ')})`
                });`).join('').substr(1)} 
${indent}        } 
${indent}    }; 
${indent}    JS.heap.put(this, mirror); 
${indent}}`;        
})

decorate(FunctionType, ({prototype}) => prototype.toNativeValue = function(this: FunctionType) {
    return `JS.wrap(${this.parent.accessor()}, ${this.typeName()}.class)`;    
})

decorate(AnyType, ({prototype}) => prototype.toNativeValue = function(this: AnyType) {
    return `JS.wrap(${this.parent.accessor()}, JS.Object::new)`;    
})

decorate(DeclaredType, ({prototype}) => prototype.toNativeValue = function(this: DeclaredType) {
    return `JS.wrap(${this.parent.accessor()}, ${this.typeName()}${this.abstract ? '.class' : '::new'})`;    
})

decorate(ArrayType, ({prototype}) => prototype.toNativeValue = function(this: ArrayType) {
    return `JS.wrap(${this.parent.accessor()}, ${this.typeArguments[0].genericToNativeValue()})`;    
})

decorate(Type, ({prototype}) => prototype.toNativeValue = function(this: Type) {
    return `(${this.typeName()})${this.parent.accessor()}`;    
})

decorate(ArrayType, ({prototype}) => prototype.genericToNativeValue = function(this: ArrayType, optional: boolean = this.optional) {
    return `o -> new JS.Array<>(o, ${this.typeArguments[0].genericToNativeValue()})`;    
})

decorate(Type, ({prototype}) => prototype.genericToNativeValue = function(this: Type, optional: boolean = this.optional) {
    return `JS.Array::new`;    
})

decorate(Type, ({prototype}) => prototype.fromNativeValue = function(this: Type) {
    return this.parent.declarationName();    
})

decorate(DeclaredType, ({prototype}) => prototype.fromNativeValue = function(this: DeclaredType) {
    return this.abstract ? this.parent.declarationName() : `JS.heap.get(${this.parent.declarationName()})`;    
})

decorate(ArrayType, ({prototype}) => prototype.fromNativeValue = function(this: ArrayType) {
    return `JS.heap.computeIfAbsent(${this.parent.declarationName()}, o -> new JS.ArrayMirror<>(${this.typeArguments[0].genericFromNativeValue(this.optional)}))`;    
})

decorate(Type, ({prototype}) => prototype.genericFromNativeValue = function(this: Type, optional: boolean = this.optional) {
    return this.parent.declarationName();    
})

decorate(ArrayType, ({prototype}) => prototype.genericFromNativeValue = function(this: ArrayType, optional: boolean = this.optional) {
    return `${this.parent.declarationName()}, JS.ArrayMirror::new`;    
})
