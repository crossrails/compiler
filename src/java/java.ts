import * as path from 'path';
import {log} from "../log"
import {EmitterOptions, Emitter} from "../emitter" 
import * as ast from "../ast"

export interface JavaEmitterOptions extends EmitterOptions {
    nashorn?: EmitterOptions 
    android?: EmitterOptions 
    basePackage: string
}

export class JavaEmitter extends Emitter<JavaEmitterOptions> {
        
    protected emitModule(module: ast.Module, options: JavaEmitterOptions): void {
        let outDir = path.join(options.outDir, module.sourceRoot, options.basePackage.replace('.', path.sep));
        let moduleFilename = path.join(outDir, `${module.name.charAt(0).toUpperCase()}${module.name.slice(1)}.java`);
        let globals = module.declarations.filter(d => !(d instanceof ast.TypeDeclaration));
        let types: ast.TypeDeclaration[] = module.declarations.filter(d => d instanceof ast.TypeDeclaration) as ast.TypeDeclaration[];
        let writtenModuleFile = false;  
        for(let type of types) {               
            let filename = path.join(outDir, path.relative(module.sourceRoot, type.sourceFile.path.dir), `${type.declarationName()}.java`);
            if(filename == moduleFilename) {
                writtenModuleFile = true;
                type = Object.create(type, {
                    members: { value: type.members.concat(globals) }
                });
            }                
            let packageName = path.relative(options.outDir, path.dirname(filename)).replace(path.sep, '.');
            this.writeFile(filename, `package ${packageName};\n\n${type.emit(filename == moduleFilename)}`);
        }        
        if(!writtenModuleFile) {
            let type: ast.ClassDeclaration = Object.create(ast.ClassDeclaration.prototype, {
                name: { value: `${module.name.charAt(0).toUpperCase()}${module.name.slice(1)}` },
                members: { value: globals }
            });
            this.writeFile(moduleFilename, `package ${options.basePackage};\n\n${type.emit(true)}`);
        }
    }
}
 
export let emitter = new JavaEmitter(); 

declare module "../ast" {
    interface Declaration {
        emit(): string
        declarationName(): string
    }
    interface TypeDeclaration {
        typeName(): string
        emit(isGlobalType?: boolean): string
        keyword(): string
        imports(isGlobalType?: boolean): string
        header(isGlobalType?: boolean): string
        footer(): string
        heritage(): string
    }
    interface FunctionDeclaration {
        body(): string
    }
    interface VariableDeclaration {
        getter(): string
        setter(): string
    }
    interface Type {
        typeName(): string;
        typeSignature(optional?: boolean): string;
    }
}

ast.Declaration.prototype.declarationName = function (this: ast.Declaration): string {
    return this.name;
}

ast.ClassDeclaration.prototype.declarationName = function (this: ast.ClassDeclaration): string {
    return this.isThrown && this.name.endsWith('Error') ? `${this.name.slice(0, -5)}Exception` : this.name;
}

ast.TypeDeclaration.prototype.heritage = function (this: ast.TypeDeclaration): string {
    return '';
}

ast.TypeDeclaration.prototype.emit = function (this: ast.TypeDeclaration, isGlobalType?: boolean): string {
    return `
${this.imports(isGlobalType)}

public ${this.keyword()} ${this.declarationName()}${this.heritage()} {

${this.header(isGlobalType)}

${this.members.reduce((out, member) => `${out}${member.emit()}\n`, '')}
${this.footer()}
}
    `.replace(/\n{3}/g, '\n').trim();
}

ast.ClassDeclaration.prototype.keyword = function (this: ast.ClassDeclaration): string {
    return "class";
}

ast.ClassDeclaration.prototype.heritage = function (this: ast.ClassDeclaration): string {
    return this.isThrown ? ' extends Exception' : '';
}

ast.InterfaceDeclaration.prototype.keyword = function (this: ast.InterfaceDeclaration): string {
    return "interface";
}

ast.VariableDeclaration.prototype.emit = function (this: ast.VariableDeclaration): string {
    return `
    public${this.static ?' static' : ''} ${this.type.typeSignature()} get${this.declarationName().charAt(0).toUpperCase()}${this.declarationName().slice(1)}() ${this.getter()}
${this.constant ? '' : `
    public${this.static ?' static' : ''} void set${this.declarationName().charAt(0).toUpperCase()}${this.declarationName().slice(1)}(${this.type.typeSignature(false)} ${this.declarationName()}) ${this.setter()}
`}`.substr(1);
}

ast.ParameterDeclaration.prototype.emit = function (this: ast.ParameterDeclaration): string {
    return `${this.type.typeName()} ${this.declarationName()}`;
}

ast.FunctionDeclaration.prototype.emit = function (this: ast.FunctionDeclaration): string {
    let modifiers = `${this.parent instanceof ast.InterfaceDeclaration ? '' : 'public '}${this.static ? 'static ' : this.abstract ? 'abstract ' : ''}`;
    let throwsClause = this.signature.thrownTypes.length ? ` throws ${Array.from(this.signature.thrownTypes.reduce((set, t) => set.add(t instanceof ast.DeclaredType ? t.typeName() : 'Exception'), new Set())).join(', ')}` : '';  
    return `    ${modifiers}${this.signature.returnType.typeSignature()} ${this.declarationName()}(${this.signature.parameters.map(p => p.emit()).join(', ')})${throwsClause}${this.hasBody ? ` ${this.body()}` : ';'}\n`;
}

ast.ConstructorDeclaration.prototype.emit = function (this: ast.ConstructorDeclaration): string {
    return `    public ${this.parent.declarationName()}(${this.signature.parameters.map(p => p.emit()).join(', ')}) ${this.body()}`;
}

ast.Type.prototype.typeSignature = function(this: ast.Type, optional: boolean = this.optional): string {
    return optional ? `Optional<${this.typeName()}>` : this.typeName();    
}

ast.FunctionType.prototype.typeSignature = function(this: ast.FunctionType, optional: boolean = this.optional): string {
    let typeArguments = this.signature.parameters.map(p => p.type);
    if(!(this.signature.returnType instanceof ast.VoidType)) {
        typeArguments = [this.signature.returnType, ...typeArguments];
    }
    let typeSignature = `${this.typeName()}${typeArguments.length == 0 ? '' : `<${typeArguments.map(a => a.typeSignature()).join(', ')}>`}`;
    return optional ? `Optional<${typeSignature}>` : typeSignature;    
}

ast.DeclaredType.prototype.typeName = function(this: ast.DeclaredType): string {
    return this.declaration ? this.declaration.declarationName() : this.name;
}

ast.VoidType.prototype.typeName = function(this: ast.VoidType): string {
    return 'void';  
}

ast.AnyType.prototype.typeName = function(this: ast.AnyType): string {
    return 'Object';  
}

ast.BooleanType.prototype.typeName = function(this: ast.BooleanType): string {
    return 'Boolean';    
}

ast.StringType.prototype.typeName = function(this: ast.StringType): string {
    return 'String'    
}

ast.NumberType.prototype.typeName = function(this: ast.NumberType): string {
    return 'Number'    
}

ast.ArrayType.prototype.typeName = function(this: ast.ArrayType): string {
    return `List<${this.typeArguments[0].typeSignature()}>`;    
}

ast.ErrorType.prototype.typeName = function(this: ast.ErrorType): string {
    return 'Exception';  
}

ast.FunctionType.prototype.typeName = function(this: ast.FunctionType): string {
    let isVoid = this.signature.returnType instanceof ast.VoidType;
    switch(this.signature.parameters.length) {
        case 0:
            return isVoid ? 'Runnable' : `Supplier`;
        case 1:
            return isVoid ? `Consumer` : `Function`;
        case 2: 
            return isVoid ? `BiConsumer` : `BiFunction`;
        default:
            throw new Error('Currently unsupported function type');
    }  
}
