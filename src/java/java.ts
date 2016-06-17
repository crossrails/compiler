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
            let filename = path.join(outDir, path.relative(module.sourceRoot, type.sourceFile.path.dir), `${type.name}.java`);
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
    }
    interface TypeDeclaration {
        emit(isGlobalType?: boolean): string
        keyword(): string
        imports(isGlobalType?: boolean): string
        header(isGlobalType?: boolean): string
        footer(): string
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
        signature(optional?: boolean): string;
    }
}

ast.TypeDeclaration.prototype.emit = function (this: ast.TypeDeclaration, isGlobalType?: boolean): string {
    return `
${this.imports(isGlobalType)}

public ${this.keyword()} ${this.name} {

${this.header(isGlobalType)}

${this.members.reduce((out, member) => `${out}${member.emit()}\n`, '')}
${this.footer()}
}
    `.replace(/\n{3}/g, '\n').trim();
}

ast.ClassDeclaration.prototype.keyword = function (this: ast.ClassDeclaration): string {
    return "class";
}

ast.InterfaceDeclaration.prototype.keyword = function (this: ast.InterfaceDeclaration): string {
    return "interface";
}

ast.VariableDeclaration.prototype.emit = function (this: ast.VariableDeclaration): string {
    return `
    public${this.static ?' static' : ''} ${this.type.signature()} get${this.name.charAt(0).toUpperCase()}${this.name.slice(1)}() ${this.getter()}
${this.constant ? '' : `
    public${this.static ?' static' : ''} void set${this.name.charAt(0).toUpperCase()}${this.name.slice(1)}(${this.type.typeName()} ${this.name}) ${this.setter()}
`}`.substr(1);
}

ast.ParameterDeclaration.prototype.emit = function (this: ast.ParameterDeclaration): string {
    return `${this.type.typeName()} ${this.name}`;
}

ast.FunctionDeclaration.prototype.emit = function (this: ast.FunctionDeclaration): string {
    let modifiers = `${this.parent instanceof ast.InterfaceDeclaration ? '' : 'public '}${this.static ? 'static ' : this.abstract ? 'abstract ' : ''}`;
    let throwsClause = this.thrownTypes.length ? ` throws ${this.thrownTypes.map(t => t instanceof ast.AnyType ? 'Exception' : t.typeName()).join(', ')}` : '';  
    return `    ${modifiers}${this.returnType.signature()} ${this.name}(${this.parameters.map(p => p.emit()).join(', ')})${throwsClause}${this.hasBody ? ` ${this.body()}` : ';'}\n`;
}

ast.ConstructorDeclaration.prototype.emit = function (this: ast.ConstructorDeclaration): string {
    return `    public ${this.parent.name}(${this.parameters.map(p => p.emit()).join(', ')}) ${this.body()}`;
}

ast.Type.prototype.signature = function(this: ast.Type, optional: boolean = this.optional): string {
    return optional ? `Optional<${this.typeName()}>` : this.typeName();    
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
    return `List<${this.typeArguments[0].signature()}>`;    
}

ast.ErrorType.prototype.typeName = function(this: ast.ErrorType): string {
    return 'Exception';  
}