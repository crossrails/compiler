import "./java"

import {Module, SourceFile, Type, VoidType, AnyType, ArrayType, Declaration, VariableDeclaration, ClassDeclaration, InterfaceDeclaration, FunctionDeclaration, MemberDeclaration, DeclaredType, ParameterDeclaration, ConstructorDeclaration, FunctionType} from "../ast"

declare module "../ast" {
    interface Declaration {
        accessor(): string
    }    
    interface MemberDeclaration {
        mirror(): string
    }
    interface Type {
        arrayElementReturnValue(optional?: boolean): string;
        returnValue(): string;
        argumentValue(): string;
        arrayElementArgumentValue(optional?: boolean): string;
    }
}

InterfaceDeclaration.prototype.imports = function (this: InterfaceDeclaration) {      
    return `import java.util.*;`
}

InterfaceDeclaration.prototype.header = function (this: InterfaceDeclaration, indent?: string) {
    return '';
}

InterfaceDeclaration.prototype.footer = function (this: InterfaceDeclaration, indent?: string) {
    return '';
}

ClassDeclaration.prototype.imports = function (this: ClassDeclaration) {
    return `
import java.util.*;
import java.util.function.*;
import jdk.nashorn.api.scripting.*;${
    this.sourceFile.isModuleFile ? '' : `\n
import static io.xrails.Src.global;`
    }`.substr(1);
}

ClassDeclaration.prototype.header = function (this: ClassDeclaration, indent?: string) {
    return `
${!this.sourceFile.isModuleFile ? '' : `
${indent}static final ScriptObjectMirror global = JS.eval("../reference/src.js");`.substr(1)
}${!this.members.some(m => m.parent != m.sourceFile) ? '' : `
${indent}private static final ScriptObjectMirror classMirror = (ScriptObjectMirror)global.get("${this.name}");\n`.substr(1)
}${!this.members.some(m => !m.static) ? '' : `
${indent}private final ScriptObjectMirror prototype;
${indent}private final JSObject mirror;

${indent}${this.declarationName()}(ScriptObjectMirror mirror) { 
${indent}    this.prototype = mirror; 
${indent}    this.mirror = mirror; 
${indent}    JS.heap.put(this, mirror);
${indent}}

`}`.substr(1);    
}

ClassDeclaration.prototype.footer = function (this: ClassDeclaration, indent?: string) {
    return !this.members.some(m => !m.static) ? '' : `
${!this.isThrown ? '' : `
${indent}public String getMessage() {
${indent}    return (String)prototype.get("message");
${indent}}    
`.substr(1)}
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
}

MemberDeclaration.prototype.mirror = function (this: MemberDeclaration) {
    return this.parent == this.sourceFile ? 'global' : this.static ? 'classMirror' : 'prototype';        
}

VariableDeclaration.prototype.accessor = function (this: VariableDeclaration) {
    return `${this.mirror()}.get("${this.declarationName()}")`
}

VariableDeclaration.prototype.getter = function (this: VariableDeclaration, indent?: string) {
    let returnValue = this.type.optional ? `Optional.ofNullable(${this.type.returnValue()})` : this.type.returnValue();
    return `{
${indent}    return ${returnValue};
${indent}}`;        
}

VariableDeclaration.prototype.setter = function (this: VariableDeclaration, indent?: string) {
    return `{
${indent}    ${this.mirror()}.setMember("${this.declarationName()}", ${this.type.argumentValue()});
${indent}}`;        
}

FunctionDeclaration.prototype.accessor = function (this: FunctionDeclaration): string {
    let args = this.signature.parameters.map(p => p.type.argumentValue());
    return this.static ? `${this.mirror()}.callMember(${[`"${this.declarationName()}"`, ...args].join(', ')})` : `((JSObject)prototype.getMember("${this.declarationName()}")).call(${[`mirror`, ...args].join(', ')})`;
}

FunctionDeclaration.prototype.body = function (this: FunctionDeclaration, indent?: string): string {
    let body = `${indent}    ${this.signature.returnType instanceof VoidType ? this.accessor() : `return ${this.signature.returnType.returnValue()}`};`;
    //todo muliple throw types
    let thrownDeclaredTypes: DeclaredType[] = this.signature.thrownTypes.filter(t => t instanceof DeclaredType) as DeclaredType[];
    if(thrownDeclaredTypes.length) {
        body = `
${indent}    try {
    ${body}
${indent}    } catch (NashornException e) {
${indent}        ScriptObjectMirror mirror = (ScriptObjectMirror)e.getEcmaError();
${indent}        Object constructor = mirror.get("constructor");
${indent}        if(constructor instanceof  ScriptObjectMirror) {
${indent}            Object name = ((ScriptObjectMirror)constructor).get("name");
${indent}            if(name instanceof String) switch ((String)name) {${
                         thrownDeclaredTypes.reduce((out, type) => `
${out}${indent}                case "${type.name}":
${indent}                    throw new ${type.typeName()}((ScriptObjectMirror)e.getEcmaError());`, '')}
${indent}            }
${indent}        }
${indent}        throw e;
${indent}    }`; 
    }
    return `{
${body}
${indent}}`        
}

ConstructorDeclaration.prototype.body = function (this: ConstructorDeclaration, indent?: string): string {
    return `{
${indent}    prototype = (ScriptObjectMirror)classMirror.newObject(${this.signature.parameters.map(p => p.type.argumentValue()).join(', ')}); 
${indent}    mirror = getClass() == ${this.parent.declarationName()}.class ? prototype : new JS.AbstractMirror(prototype) { 
${indent}        @Override 
${indent}        void build(BiConsumer<String, Function<Object[], Object>> builder) { 
${this.parent.members.filter(m => !m.static && m.constructor.name === 'FunctionDeclaration').map((m: FunctionDeclaration) => `
${indent}            builder.accept("${m.declarationName()}", args -> ${m.signature.returnType instanceof VoidType ? 
                     `{ ${m.declarationName()}(${m.signature.parameters.map((p, i) => `(${p.type.typeName()})args[${i}]`).join(', ')}); return null; }` : 
                     `${m.declarationName()}(${m.signature.parameters.map((p, i) => `(${p.type.typeName()})args[${i}]`).join(', ')})`
                });`).join('').substr(1)} 
${indent}        } 
${indent}    }; 
${indent}    JS.heap.put(this, mirror); 
${indent}}`;        
}

FunctionType.prototype.returnValue = function(this: FunctionType) {
    return `JS.wrap(${this.parent.accessor()}, ${this.typeName()}.class)`;    
}

AnyType.prototype.returnValue = function(this: AnyType) {
    return `JS.wrap(${this.parent.accessor()}, JS.Object::new)`;    
}

DeclaredType.prototype.returnValue = function(this: DeclaredType) {
    return `JS.wrap(${this.parent.accessor()}, ${this.typeName()}${this.declaration instanceof InterfaceDeclaration ? '.class' : '::new'})`;    
}

ArrayType.prototype.returnValue = function(this: ArrayType) {
    return `JS.wrap(${this.parent.accessor()}, ${this.typeArguments[0].arrayElementReturnValue()})`;    
}

Type.prototype.returnValue = function(this: Type) {
    return `(${this.typeName()})${this.parent.accessor()}`;    
}

ArrayType.prototype.arrayElementReturnValue = function(this: ArrayType, optional: boolean = this.optional) {
    return `o -> new JS.Array<>(o, ${this.typeArguments[0].arrayElementReturnValue()})`;    
}

Type.prototype.arrayElementReturnValue = function(this: Type, optional: boolean = this.optional) {
    return `JS.Array::new`;    
}

Type.prototype.argumentValue = function(this: Type) {
    return this.parent.declarationName();    
}

DeclaredType.prototype.argumentValue = function(this: DeclaredType) {
    return this.declaration instanceof InterfaceDeclaration ? this.parent.declarationName() : `JS.heap.get(${this.parent.declarationName()})`;    
}

ArrayType.prototype.argumentValue = function(this: ArrayType) {
    return `JS.heap.computeIfAbsent(${this.parent.declarationName()}, o -> new JS.ArrayMirror<>(${this.typeArguments[0].arrayElementArgumentValue(this.optional)}))`;    
}

Type.prototype.arrayElementArgumentValue = function(this: Type, optional: boolean = this.optional) {
    return this.parent.declarationName();    
}

ArrayType.prototype.arrayElementArgumentValue = function(this: ArrayType, optional: boolean = this.optional) {
    return `${this.parent.declarationName()}, JS.ArrayMirror::new`;    
}
