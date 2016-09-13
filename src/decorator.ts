import {SourceFile, Declaration, FunctionDeclaration, ClassDeclaration, DeclaredType, NamespaceDeclaration, GenericType} from "./ast"
import * as assert from "assert"
import {ParsedPath} from 'path';


const decorations : Map<Function, { proxy: { prototype: any }, changes: Map<PropertyKey, Function|undefined>}> = new Map();

export function decorate<T extends Function>(target: T, decorator: (type: T) => void) {
    let decoration = decorations.get(target.prototype);
    if(!decoration) {
        decoration = {
            changes: new Map(), 
            proxy: { 
                prototype: new Proxy(target.prototype, {
                    set(prototype: T, property: PropertyKey, value: any, receiver: any): boolean {
                        const existing = Reflect.getOwnPropertyDescriptor(prototype, property);    
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
    for (const [prototype, decoration] of decorations) {
        decoration.changes.forEach((value, property) => value ? Reflect.set(prototype, property, value) : Reflect.deleteProperty(prototype, property)); 
    }
    decorations.clear();    
}

declare module "./ast" {

    interface Module {
        name: string
        sourcePath: ParsedPath
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

    interface NamespaceDeclaration {
        transformedDeclarations(): ReadonlyArray<Declaration>
        keyword(): string
        suffix(): string
        header(indent?: string): string
        footer(indent?: string): string
    }

    interface Type {
        emit(optional?: boolean): string;
        typeName(): string;
    } 

    interface GenericType {
        genericTypeName(): string;
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
    return this.name;
}

FunctionDeclaration.prototype.emit = function (this: FunctionDeclaration, indent?: string): string {
    return `${indent}${this.prefix()} ${this.declarationName()}(${this.signature.parameters.map(p => p.emit()).join(', ')})${this.suffix()}${this.isAbstract ? '\n' : ` ${this.body(indent)}\n`}`;
}

NamespaceDeclaration.prototype.transformedDeclarations = function (this: NamespaceDeclaration, indent?: string): ReadonlyArray<Declaration> {
    return this.declarations;
}

ClassDeclaration.prototype.keyword = function (this: ClassDeclaration): string {
    return "class";
}

NamespaceDeclaration.prototype.emit = function (this: NamespaceDeclaration, indent?: string): string {
    return `
${indent}public ${this.keyword()} ${this.declarationName()}${this.suffix()} {

${this.header(`${indent}    `)}

${this.transformedDeclarations().reduce((out, member) => `${out}${member.emit(`${indent}    `)}\n`, '')}
${this.footer(`${indent}    `)}
${indent}}
    `.replace(/\n{3}/g, '\n').substr(1);
}

NamespaceDeclaration.prototype.suffix = function (this: NamespaceDeclaration): string {
    return '';
}

NamespaceDeclaration.prototype.header = function (this: NamespaceDeclaration, indent?: string): string {
    return "";
}

NamespaceDeclaration.prototype.footer = function (this: NamespaceDeclaration, indent?: string): string {
    return "";
}

GenericType.prototype.typeName = function(this: GenericType): string {
    return `${this.genericTypeName()}${this.typeArguments.length == 0 ? '' : `<${this.typeArguments[0].emit()}>`}`;    
}

DeclaredType.prototype.genericTypeName = function(this: DeclaredType): string {
    return this.name;    
}

