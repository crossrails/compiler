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
        let srcRoot = path.join(options.outDir, module.sourceRoot, options.basePackage.replace('.', path.sep));
        let moduleFilename = path.join(srcRoot, `${module.name.charAt(0).toUpperCase()}${module.name.slice(1)}.java`);
        let globals = module.declarations.filter(d => !(d instanceof ast.TypeDeclaration));
        let types: ast.TypeDeclaration[] = module.declarations.filter(d => d instanceof ast.TypeDeclaration) as ast.TypeDeclaration[];
        let writtenModuleFile = false;  
        for(let type of types) {               
            let filename = `${path.join(srcRoot, path.relative(srcRoot, type.sourceFile.path.dir), type.name)}.java`;
            if(filename == moduleFilename) {
                writtenModuleFile = true;
                type = Object.create(type, {
                    members: { value: type.members.concat(globals) }
                });
            }                
            let packageName = path.relative(type.module.sourceRoot, type.sourceFile.path.dir).replace(path.sep, '.');
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
    let lines: string[] = [];
    lines.push(`${this.imports(isGlobalType)}\n`);
    lines.push(`${this.keyword()} ${this.name} {\n`);
    lines.push(this.header(isGlobalType));
    for(let member of this.members as Array<ast.Declaration>) {
        lines.push(`${member.emit()}`);
    }
    lines.push(this.footer());
    lines.push(`}`);
    return lines.join('\n');
}

ast.ClassDeclaration.prototype.keyword = function (this: ast.ClassDeclaration): string {
    return "class";
}

ast.VariableDeclaration.prototype.emit = function (this: ast.VariableDeclaration): string {
    let output = `    public${this.static?' static':''} ${this.type.signature()} get${this.name.charAt(0).toUpperCase()}${this.name.slice(1)}() ${this.getter()}\n`;
    if(!this.constant) {
        output = `${output}\n    public${this.static?' static':''} void set${this.name.charAt(0).toUpperCase()}${this.name.slice(1)}(${this.type.signature()} value) ${this.setter()}\n`;    
    }
    return output;
}

ast.Type.prototype.signature = function(this: ast.Type, optional: boolean = this.optional): string {
    return optional ? `Optional<${this.typeName()}>` : this.typeName();    
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