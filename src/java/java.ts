import * as path from 'path';
import {log} from "../log"
import {decorate} from '../decorator';
import {CompilerOptions} from "../compiler" 
import {
    Module, SourceFile, Type, VoidType, AnyType, BooleanType, StringType, NumberType, ErrorType, ArrayType, Declaration, VariableDeclaration, TypeDeclaration, ClassDeclaration, InterfaceDeclaration, FunctionDeclaration, MemberDeclaration, DeclaredType, ParameterDeclaration, ConstructorDeclaration, FunctionType
} from "../ast"

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
        getter(indent?: string): string
        setter(indent?: string): string
    }
}
 
decorate(Module, ({prototype}) => prototype.emit = function (this: Module, rootOutDir: string, options: JavaOptions, writeFile: (filename: string, data: string) => void): void {
    let outDir = path.join(rootOutDir, options.basePackage.replace('.', path.sep));
    let moduleFilename = path.join(outDir, `${this.name.charAt(0).toUpperCase()}${this.name.slice(1)}.java`);
    let globals = this.declarations.filter(d => d instanceof MemberDeclaration && !(d instanceof TypeDeclaration)) as MemberDeclaration[];
    let writtenModuleFile = false;  
    for(let type of this.declarations.filter(d => d instanceof TypeDeclaration) as TypeDeclaration[]) {               
        let filename = path.join(outDir, path.relative(this.sourceRoot, type.sourceFile.path.dir), `${type.declarationName()}.java`);
        let file: SourceFile = Object.create(SourceFile.prototype, {
            isModuleFile: { value: filename == moduleFilename},
            name: { value: type.name },
            packageName: { value: path.relative(rootOutDir, path.dirname(filename)).replace(path.sep, '.') },
            declarations: { value: [ filename != moduleFilename ? type : Object.create(type, { members: { value: type.members.concat(globals) }})] }
        });
        writeFile(filename, file.emit());
        writtenModuleFile = writtenModuleFile || file.isModuleFile;
    }        
    if(!writtenModuleFile) {
        let name = `${this.name.charAt(0).toUpperCase()}${this.name.slice(1)}`;
        let file: SourceFile = Object.create(SourceFile.prototype, {
            isModuleFile: { value: true},
            name: { value: name },
            packageName: { value: options.basePackage },
            declarations: { value: [ Object.create(ClassDeclaration.prototype, { name: { value: name }, module: { value: this }, members: { value: globals }}) ] }
        });
        Reflect.set(file.declarations[0], 'parent', file);
        writeFile(moduleFilename, file.emit());
    }
}) 

decorate(SourceFile, ({prototype}) => prototype.header = function (this: SourceFile): string {
    return `package ${this.packageName};\n\n${(this.declarations[0] as TypeDeclaration).imports()}\n`;
})

decorate(SourceFile, ({prototype}) => prototype.footer = function (this: SourceFile): string {
    return '';
})

decorate(ClassDeclaration, ({prototype}) => prototype.declarationName = function (this: ClassDeclaration): string {
    return this.isThrown && this.name.endsWith('Error') ? `${this.name.slice(0, -5)}Exception` : this.name;
})

decorate(TypeDeclaration, ({prototype}) => prototype.suffix = function (this: TypeDeclaration): string {
    return '';
})

decorate(ClassDeclaration, ({prototype}) => prototype.suffix = function (this: ClassDeclaration): string {
    return this.isThrown ? ' extends Exception' : '';
})

decorate(InterfaceDeclaration, ({prototype}) => prototype.keyword = function (this: InterfaceDeclaration): string {
    return "interface";
})

decorate(VariableDeclaration, ({prototype}) => prototype.emit = function (this: VariableDeclaration, indent?: string): string {
    return `
${indent}${this.protected ? 'protected' : 'public'}${this.static ?' static' : ''} ${this.type.emit()} get${this.declarationName().charAt(0).toUpperCase()}${this.declarationName().slice(1)}() ${this.getter(indent)}
    ${this.constant ? '' : `
${indent}${this.protected ? 'protected' : 'public'}${this.static ?' static' : ''} void set${this.declarationName().charAt(0).toUpperCase()}${this.declarationName().slice(1)}(${this.type.emit(false)} ${this.declarationName()}) ${this.setter(indent)}
    `}`.substr(1);
})

decorate(ParameterDeclaration, ({prototype}) => prototype.emit = function (this: ParameterDeclaration): string {
    return `${this.type.emit()} ${this.declarationName()}`;
})

decorate(FunctionDeclaration, ({prototype}) => prototype.prefix = function (this: FunctionDeclaration): string {
    return `${this.parent instanceof InterfaceDeclaration ? '' : this.protected ? 'protected ' : 'public '}${this.static ? 'static ' : this.abstract && !(this.parent instanceof InterfaceDeclaration) ? 'abstract ' : ''}${this.signature.returnType.emit()}`;
})

decorate(FunctionDeclaration, ({prototype}) => prototype.suffix = function (this: FunctionDeclaration): string {
    return `${this.signature.thrownTypes.length ? ` throws ${Array.from(this.signature.thrownTypes.reduce((set, t) => set.add(t instanceof DeclaredType ? t.typeName() : 'Exception'), new Set())).join(', ')}` : ''}${this.abstract ? '' : ';'}`;
})

decorate(ConstructorDeclaration, ({prototype}) => prototype.prefix = function (this: ConstructorDeclaration): string {
    return this.protected ? 'protected' : 'public';
})

decorate(ConstructorDeclaration, ({prototype}) => prototype.declarationName = function (this: ConstructorDeclaration): string {
    return this.parent.declarationName();
})

decorate(Type, ({prototype}) => prototype.emit = function(this: Type, optional: boolean = this.optional): string {
    return optional ? `Optional<${this.typeName()}>` : this.typeName();    
})

decorate(FunctionType, ({prototype}) => prototype.emit = function(this: FunctionType, optional: boolean = this.optional): string {
    let typeArguments = this.signature.parameters.map(p => p.type);
    if(!(this.signature.returnType instanceof VoidType)) {
        typeArguments = [this.signature.returnType, ...typeArguments];
    }
    let typeSignature = `${this.typeName()}${typeArguments.length == 0 ? '' : `<${typeArguments.map(a => a.emit()).join(', ')}>`}`;
    return optional ? `Optional<${typeSignature}>` : typeSignature;    
})

decorate(VoidType, ({prototype}) => prototype.typeName = function(this: VoidType): string {
    return 'void';  
})

decorate(AnyType, ({prototype}) => prototype.typeName = function(this: AnyType): string {
    return 'Object';  
})

decorate(BooleanType, ({prototype}) => prototype.typeName = function(this: BooleanType): string {
    return 'Boolean';    
})

decorate(StringType, ({prototype}) => prototype.typeName = function(this: StringType): string {
    return 'String'    
})

decorate(NumberType, ({prototype}) => prototype.typeName = function(this: NumberType): string {
    return 'Number'    
})

decorate(ArrayType, ({prototype}) => prototype.typeName = function(this: ArrayType): string {
    return `List<${this.typeArguments[0].emit()}>`;    
})

decorate(ErrorType, ({prototype}) => prototype.typeName = function(this: ErrorType): string {
    return 'Exception';  
})

decorate(FunctionType, ({prototype}) => prototype.typeName = function(this: FunctionType): string {
    let isVoid = this.signature.returnType instanceof VoidType;
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
