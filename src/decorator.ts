import {SourceFile, Declaration, FunctionDeclaration, TypeDeclaration, ClassDeclaration, DeclaredType} from "./ast"
import * as assert from "assert"

let decorations : Map<Function, { proxy: { prototype: any }, changes: Map<PropertyKey, Function|undefined>}> = new Map();

export function decorate<T extends Function>(target: T, decorator: (type: T) => void) {
    let decoration = decorations.get(target.prototype);
    if(!decoration) {
        decoration = {
            changes: new Map(), 
            proxy: { 
                prototype: new Proxy(target.prototype, {
                    set(prototype: T, property: PropertyKey, value: any, receiver: any): boolean {
                        let existing = Reflect.getOwnPropertyDescriptor(prototype, property);    
                        decorations.get(prototype)!.changes.set(property, existing ? existing.value : undefined);
                        return Reflect.set(prototype, property, value, receiver);                    
                    }
                })
            }
        }
        decorations.set(target.prototype, decoration!);
    }
    decorator(decoration.proxy as T);
}

export function undecorate() {
    for (let [prototype, decoration] of decorations) {
        decoration.changes.forEach((value, property) => value ? Reflect.set(prototype, property, value) : Reflect.deleteProperty(prototype, property)); 
    }
    decorations.clear();    
}

declare module "./ast" {

    interface Module {
        emit<Options>(outDir: string, options: Options, writeFile: (filename: string, data: string) => void): void
        emitWrapper<Options>(outDir: string, options: Options, writeFile: (filename: string, data: string) => void): void
    }

    interface Declaration {
        emit(indent?: string): string
        declarationName(): string
    }

    interface SourceFile {
        isModuleFile: boolean
        emit(): string
        header(): string
        footer(): string
    }

    interface FunctionDeclaration {
        prefix(): string
        suffix(): string
        body(indent?: string): string
    }

    interface TypeDeclaration {
        keyword(): string
        typeName(): string
        suffix(): string
        header(indent?: string): string
        footer(indent?: string): string
    }

    interface Type {
        emit(optional?: boolean): string;
        typeName(): string;
    } 
}

SourceFile.prototype.emit = function (this: SourceFile): string {
        return `
${this.header()}
${this.declarations.reduce((out, d) => `${out}${d.emit('')}\n`, '')}
${this.footer()}
`.trim()
}

Declaration.prototype.declarationName = function(this: Declaration): string {
    return this.name;
}

DeclaredType.prototype.typeName = function(this: DeclaredType): string {
    return this.declaration ? this.declaration.declarationName() : this.name!;
}

FunctionDeclaration.prototype.emit = function (this: FunctionDeclaration, indent?: string): string {
    return `${indent}${this.prefix()} ${this.declarationName()}(${this.signature.parameters.map(p => p.emit()).join(', ')})${this.suffix()}${this.hasBody ? ` ${this.body(indent)}\n` : '\n'}`;
}

TypeDeclaration.prototype.emit = function (this: TypeDeclaration, indent?: string): string {
    return `
${indent}public ${this.keyword()} ${this.declarationName()}${this.suffix()} {

${this.header(`${indent}    `)}

${this.members.reduce((out, member) => `${out}${member.emit(`${indent}    `)}\n`, '')}
${this.footer(`${indent}    `)}
${indent}}
    `.replace(/\n{3}/g, '\n').substr(1);
}

ClassDeclaration.prototype.keyword = function (this: ClassDeclaration): string {
    return "class";
}

TypeDeclaration.prototype.header = function (this: TypeDeclaration, indent?: string): string {
    return "";
}

TypeDeclaration.prototype.footer = function (this: TypeDeclaration, indent?: string): string {
    return "";
}

