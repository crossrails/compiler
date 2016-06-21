import {SourceFile, Declaration, FunctionDeclaration, TypeDeclaration, ClassDeclaration, DeclaredType} from "./ast"

let decorations : Map<Function, { proxy: { prototype: any }, additions: Set<PropertyKey>}> = new Map();

export function decorate<T extends Function>(target: T, decorator: (type: T) => void) {
    let decoration = decorations.get(target);
    if(!decoration) {
        decoration = {
            additions: new Set(), 
            proxy: { 
                prototype: new Proxy(target.prototype, {
                    set(target: T, property: PropertyKey, value: any, proxy: { emitters: PropertyKey[] }): boolean {
                        Object.defineProperty(target, property, { value: value });
                        decorations.get(target)!.additions.add(property);
                        return true;
                    }
                })
            }
        }
        decorations.set(target, decoration!);
    }
    decorator(decoration.proxy as T);
}

export function undecorate() {
        for (let [target, decoration] of decorations) {
            decoration.additions.forEach(property => delete target.prototype[property]);
        }
        decorations.clear();    
}

declare module "./ast" {

    interface Module {
        emit<Options>(options: Options, writeFile: (filename: string, data: string) => void): void
    }

    interface Declaration {
        emit(): string
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
        body(): string
    }

    interface TypeDeclaration {
        keyword(): string
        typeName(): string
        suffix(): string
        header(): string
        footer(): string
    }

    interface Type {
        emit(optional?: boolean): string;
        typeName(): string;
    } 
}

SourceFile.prototype.emit = function (this: SourceFile): string {
        return `
${this.header()}
${this.declarations.reduce((out, d) => `${out}${d.emit()}\n`, '')}
${this.footer()}
`.substr(1)
}

Declaration.prototype.declarationName = function(this: Declaration): string {
    return this.name;
}

DeclaredType.prototype.typeName = function(this: DeclaredType): string {
    return this.declaration ? this.declaration.declarationName() : this.name;
}

FunctionDeclaration.prototype.emit = function (this: FunctionDeclaration): string {
    return `${this.prefix()} ${this.declarationName()}(${this.signature.parameters.map(p => p.emit()).join(', ')})${this.suffix()}${this.hasBody ? ` ${this.body()}\n` : '\n'}`;
}

TypeDeclaration.prototype.emit = function (this: TypeDeclaration): string {
    return `
public ${this.keyword()} ${this.declarationName()}${this.suffix()} {

${this.header()}

${this.members.reduce((out, member) => `${out}${member.emit()}\n`, '')}
${this.footer()}
}
    `.replace(/\n{3}/g, '\n').trim();
}

ClassDeclaration.prototype.keyword = function (this: ClassDeclaration): string {
    return "class";
}
