import * as path from 'path';
import * as ast from "../ast"
import {log} from "../log"
import {decorate} from '../decorator';
import {CompilerOptions} from "../compiler" 

export interface JavaOptions extends CompilerOptions {
    nashorn?: CompilerOptions 
    android?: CompilerOptions 
    basePackage: string
}

declare module "../ast" {
    interface SourceFile {
        packageName: string
    }

    interface TypeDeclaration {
        imports(): string
    }

    interface VariableDeclaration {
        getter(): string
        setter(): string
    }
}
 
decorate(ast.Module, x => x.prototype.emit = function (this: ast.Module, options: JavaOptions, writeFile: (filename: string, data: string) => void): void {
    let outDir = path.join(options.outDir, this.sourceRoot, options.basePackage.replace('.', path.sep));
    let moduleFilename = path.join(outDir, `${this.name.charAt(0).toUpperCase()}${this.name.slice(1)}.java`);
    let globals = this.declarations.filter(d => !(d instanceof ast.TypeDeclaration));
    let writtenModuleFile = false;  
    for(let type of this.declarations.filter(d => d instanceof ast.TypeDeclaration) as ast.TypeDeclaration[]) {               
        let filename = path.join(outDir, path.relative(this.sourceRoot, type.sourceFile.path.dir), `${type.declarationName()}.java`);
        let file: ast.SourceFile = Object.create(ast.SourceFile.prototype, {
            isModuleFile: { value: filename == moduleFilename},
            name: { value: type.name },
            packageName: { value: path.relative(options.outDir, path.dirname(filename)).replace(path.sep, '.') },
            declarations: { value: [ filename != moduleFilename ? type : Object.create(type, { members: { value: type.members.concat(globals) }})] }
        });
        writeFile(filename, file.emit());
        writtenModuleFile = writtenModuleFile || file.isModuleFile;
    }        
    if(!writtenModuleFile) {
        let name = `${this.name.charAt(0).toUpperCase()}${this.name.slice(1)}`;
        let file: ast.SourceFile = Object.create(ast.SourceFile.prototype, {
            isModuleFile: { value: true},
            name: { value: name },
            packageName: { value: options.basePackage },
            declarations: { value: [ Object.create(ast.ClassDeclaration.prototype, { name: { value: name }, members: { value: globals }}) ] }
        });
        Reflect.set(file.declarations[0], 'parent', file);
        writeFile(moduleFilename, file.emit());
    }
}) 

decorate(ast.SourceFile, x => x.prototype.header = function (this: ast.SourceFile): string {
    return `package ${this.packageName};\n\n${(this.declarations[0] as ast.TypeDeclaration).imports()}\n`;
})

decorate(ast.SourceFile, x => x.prototype.footer = function (this: ast.SourceFile): string {
    return '';
})

decorate(ast.ClassDeclaration, x => x.prototype.declarationName = function (this: ast.ClassDeclaration): string {
    return this.isThrown && this.name.endsWith('Error') ? `${this.name.slice(0, -5)}Exception` : this.name;
})

decorate(ast.TypeDeclaration, x => x.prototype.suffix = function (this: ast.TypeDeclaration): string {
    return '';
})

decorate(ast.ClassDeclaration, x => x.prototype.suffix = function (this: ast.ClassDeclaration): string {
    return this.isThrown ? ' extends Exception' : '';
})

decorate(ast.InterfaceDeclaration, x => x.prototype.keyword = function (this: ast.InterfaceDeclaration): string {
    return "interface";
})

decorate(ast.VariableDeclaration, x => x.prototype.emit = function (this: ast.VariableDeclaration): string {
    return `
    public${this.static ?' static' : ''} ${this.type.emit()} get${this.declarationName().charAt(0).toUpperCase()}${this.declarationName().slice(1)}() ${this.getter()}
${this.constant ? '' : `
    public${this.static ?' static' : ''} void set${this.declarationName().charAt(0).toUpperCase()}${this.declarationName().slice(1)}(${this.type.emit(false)} ${this.declarationName()}) ${this.setter()}
`}`.substr(1);
})

decorate(ast.ParameterDeclaration, x => x.prototype.emit = function (this: ast.ParameterDeclaration): string {
    return `${this.type.emit()} ${this.declarationName()}`;
})

decorate(ast.FunctionDeclaration, x => x.prototype.emit = function (this: ast.FunctionDeclaration): string {
    let modifiers = `${this.parent instanceof ast.InterfaceDeclaration ? '' : 'public '}${this.static ? 'static ' : this.abstract ? 'abstract ' : ''}`;
    let throwsClause = this.signature.thrownTypes.length ? ` throws ${Array.from(this.signature.thrownTypes.reduce((set, t) => set.add(t instanceof ast.DeclaredType ? t.typeName() : 'Exception'), new Set())).join(', ')}` : '';  
    return `    ${modifiers}${this.signature.returnType.emit()} ${this.declarationName()}(${this.signature.parameters.map(p => p.emit()).join(', ')})${throwsClause}${this.hasBody ? ` ${this.body()}` : ';'}\n`;
})

decorate(ast.ConstructorDeclaration, x => x.prototype.emit = function (this: ast.ConstructorDeclaration): string {
    return `    public ${this.parent.declarationName()}(${this.signature.parameters.map(p => p.emit()).join(', ')}) ${this.body()}`;
})

decorate(ast.Type, x => x.prototype.emit = function(this: ast.Type, optional: boolean = this.optional): string {
    return optional ? `Optional<${this.typeName()}>` : this.typeName();    
})

decorate(ast.FunctionType, x => x.prototype.emit = function(this: ast.FunctionType, optional: boolean = this.optional): string {
    let typeArguments = this.signature.parameters.map(p => p.type);
    if(!(this.signature.returnType instanceof ast.VoidType)) {
        typeArguments = [this.signature.returnType, ...typeArguments];
    }
    let typeSignature = `${this.typeName()}${typeArguments.length == 0 ? '' : `<${typeArguments.map(a => a.emit()).join(', ')}>`}`;
    return optional ? `Optional<${typeSignature}>` : typeSignature;    
})

decorate(ast.DeclaredType, x => x.prototype.typeName = function(this: ast.DeclaredType): string {
    return this.declaration ? this.declaration.declarationName() : this.name;
})

decorate(ast.VoidType, x => x.prototype.typeName = function(this: ast.VoidType): string {
    return 'void';  
})

decorate(ast.AnyType, x => x.prototype.typeName = function(this: ast.AnyType): string {
    return 'Object';  
})

decorate(ast.BooleanType, x => x.prototype.typeName = function(this: ast.BooleanType): string {
    return 'Boolean';    
})

decorate(ast.StringType, x => x.prototype.typeName = function(this: ast.StringType): string {
    return 'String'    
})

decorate(ast.NumberType, x => x.prototype.typeName = function(this: ast.NumberType): string {
    return 'Number'    
})

decorate(ast.ArrayType, x => x.prototype.typeName = function(this: ast.ArrayType): string {
    return `List<${this.typeArguments[0].emit()}>`;    
})

decorate(ast.ErrorType, x => x.prototype.typeName = function(this: ast.ErrorType): string {
    return 'Exception';  
})

decorate(ast.FunctionType, x => x.prototype.typeName = function(this: ast.FunctionType): string {
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
})
