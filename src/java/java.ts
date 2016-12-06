import * as path from 'path';
import {log} from "../log"
import {decorate} from '../decorator';
import {EmitterOptions} from "../emitter" 
import {
    Module, SourceFile, Type, GenericType, VoidType, AnyType, BooleanType, StringType, NumberType, ErrorType, ArrayType, Declaration, VariableDeclaration, NamespaceDeclaration, ClassDeclaration, InterfaceDeclaration, FunctionDeclaration, DeclaredType, ParameterDeclaration, ConstructorDeclaration, FunctionType, DateType, adopt
} from "../ast"

export interface JavaOptions extends EmitterOptions {
    nashorn?: EmitterOptions 
    android?: EmitterOptions 
    basePackage: string
}

declare module "../ast" {
    interface SourceFile {
        packageName: string
    }

    interface Declaration {
        engineImports(): string
    }

    interface VariableDeclaration {
        getter(indent?: string): string
        setter(indent?: string): string
    }

    interface Type {
        emit(optional?: boolean): string;
        erasure(): string;
    } 
}
 
decorate(Module, ({prototype}) => prototype.emit = function (this: Module, rootOutDir: string, options: JavaOptions, writeFile: (filename: string, data: string) => void): void {
    let outDir = path.join(rootOutDir, options.basePackage.replace('.', path.sep));
    let moduleFilename = path.join(outDir, `${this.name.charAt(0).toUpperCase()}${this.name.slice(1)}.java`);
    const declarations = [...this.allDeclarations()].filter(d => d.parent instanceof SourceFile);
    let globals = declarations.filter(d => !(d instanceof NamespaceDeclaration));
    let writtenModuleFile = false;  
    for(let declaration of declarations.filter(d => d instanceof NamespaceDeclaration) as NamespaceDeclaration[]) {               
        let filename = path.join(outDir, path.relative(this.sourceRoot, declaration.sourceFile.path.dir), `${declaration.declarationName()}.java`);
        let file: SourceFile = Object.create(SourceFile.prototype, {
            name: { value: declaration.name },
            module: { value: this },
            isModuleFile: { value: filename.toLowerCase() == moduleFilename.toLowerCase()},
            packageName: { value: path.relative(rootOutDir, path.dirname(filename)).replace(path.sep, '.') },
            declarations: { value: [ filename.toLowerCase() != moduleFilename.toLowerCase() ? Object.create(declaration) : Object.create(declaration, { declarations: { value: (declaration.declarations as Declaration[]).concat(globals) }})] }
        });
        Object.defineProperty(file, 'imports', { writable: false, value: file.requiredImports.map(i => options.imports && options.imports[i.index] && options.imports[i.index] != '*' ? options.imports[i.index] : i.default)});
        adopt(file.declarations, file);
        writeFile(filename, file.emit());
        writtenModuleFile = writtenModuleFile || file.isModuleFile;
    }        
    if(!writtenModuleFile) {
        let name = `${this.name.charAt(0).toUpperCase()}${this.name.slice(1)}`;
        let file: SourceFile = Object.create(SourceFile.prototype, {
            name: { value: name },
            module: { value: this },
            isModuleFile: { value: true},
            imports: { value: [] },
            packageName: { value: options.basePackage },
            declarations: { value: [ Object.create(ClassDeclaration.prototype, { name: { value: name }, module: { value: this }, declarations: { value: globals }}) ] }
        });
        adopt(file.declarations, file);
        writeFile(moduleFilename, file.emit());
    }
}) 

decorate(SourceFile, ({prototype}) => prototype.header = function (this: SourceFile): string {
    return `package ${this.packageName};\n\n${this.declarations[0].engineImports()}\n${this.imports.reduce((out, name) => `\nimport ${name}.*;`, '')}\n`;
})

decorate(SourceFile, ({prototype}) => prototype.footer = function (this: SourceFile): string {
    return '';
})

decorate(ClassDeclaration, ({prototype}) => prototype.declarationName = function (this: ClassDeclaration): string {
    return this.isThrown && this.name.endsWith('Error') ? `${this.name.slice(0, -5)}Exception` : this.name;
})

decorate(DeclaredType, ({prototype}) => prototype.typeName = function (this: DeclaredType): string {
    return this.isThrown && this.name.endsWith('Error') ? `${this.name.slice(0, -5)}Exception` : this.name;
})

decorate(NamespaceDeclaration, ({prototype}) => prototype.transformedDeclarations = function (this: NamespaceDeclaration): ReadonlyArray<Declaration> {
    logErrorsForFunctionsWithSameErasure(this.declarations);
    return withOverloadsForFunctionsWithOptionalParameters(this.declarations);
})

decorate(NamespaceDeclaration, ({prototype}) => prototype.keyword = function (this: NamespaceDeclaration): string {
    return "final class";
})

decorate(ClassDeclaration, ({prototype}) => prototype.suffix = function (this: ClassDeclaration): string {
    return this.isThrown ? ' extends Exception' : '';
})

decorate(InterfaceDeclaration, ({prototype}) => prototype.keyword = function (this: InterfaceDeclaration): string {
    return "interface";
})

decorate(VariableDeclaration, ({prototype}) => prototype.emit = function (this: VariableDeclaration, indent?: string): string {
    let name = `${this.declarationName().charAt(0).toUpperCase()}${this.declarationName().slice(1)}`;
    return `
${indent}${this.parent instanceof InterfaceDeclaration ? '' : this.isProtected ? 'protected' : 'public'}${this.isStatic ? ' static' : ''} ${this.type.emit()} get${name}()${this.isAbstract ? ';' : ` ${this.getter(indent)}`}
    ${this.isConstant ? '' : `
${indent}${this.parent instanceof InterfaceDeclaration ? '' : this.isProtected ? 'protected' : 'public'}${this.isStatic ? ' static' : ''} void set${name}(${this.type.emit(false)} ${this.name})${this.isAbstract ? ';' : ` ${this.setter(indent)}`}
    `}`.substr(1);
})

decorate(ParameterDeclaration, ({prototype}) => prototype.emit = function (this: ParameterDeclaration): string {
    return `${this.type.emit()} ${this.declarationName()}`;
})

decorate(FunctionDeclaration, ({prototype}) => prototype.prefix = function (this: FunctionDeclaration): string {
    return `${this.parent instanceof InterfaceDeclaration ? '' : this.isProtected ? 'protected ' : 'public '}${this.isStatic ? 'static ' : this.isAbstract && !(this.parent instanceof InterfaceDeclaration) ? 'abstract ' : ''}${this.signature.returnType.emit()}`;
})

decorate(FunctionDeclaration, ({prototype}) => prototype.suffix = function (this: FunctionDeclaration): string {
    return `${this.signature.thrownTypes.length ? ` throws ${Array.from(this.signature.thrownTypes.reduce((set, t) => set.add(t instanceof DeclaredType ? t.typeName() : 'Exception'), new Set())).join(', ')}` : ''}${this.isAbstract ? ';' : ''}`;
})

decorate(ConstructorDeclaration, ({prototype}) => prototype.prefix = function (this: ConstructorDeclaration): string {
    return this.isProtected ? 'protected' : 'public';
})

decorate(ConstructorDeclaration, ({prototype}) => prototype.declarationName = function (this: ConstructorDeclaration): string {
    return this.parent.declarationName();
})

decorate(Type, ({prototype}) => prototype.emit = function(this: Type, optional: boolean = this.isOptional): string {
    return optional ? `Optional<${this.typeName()}>` : this.typeName();    
})

decorate(Type, ({prototype}) => prototype.erasure = function(this: Type): string {
    return this.typeName();    
})

decorate(GenericType, ({prototype}) => prototype.erasure = function(this: GenericType): string {
    return this.genericTypeName();    
})

decorate(FunctionType, ({prototype}) => prototype.emit = function(this: FunctionType, optional: boolean = this.isOptional): string {
    let typeArguments = this.signature.parameters.map(p => p.type);
    if(!(this.signature.returnType instanceof VoidType)) {
        typeArguments = [this.signature.returnType, ...typeArguments];
    }
    let typeSignature = `${this.typeName()}${typeArguments.length == 0 || this.signature.parameters.length > 2 ? '' : `<${typeArguments.map(a => a.emit()).join(', ')}>`}`;
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

decorate(ArrayType, ({prototype}) => prototype.genericTypeName = function(this: ArrayType): string {
    return `List`;    
})

decorate(ErrorType, ({prototype}) => prototype.typeName = function(this: ErrorType): string {
    return 'Exception';  
})

decorate(DateType, ({prototype}) => prototype.typeName = function(this: DateType): string {
    return 'Date';  
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
            return 'Object';
    }  
})

function withOverloadsForFunctionsWithOptionalParameters(declarations: ReadonlyArray<Declaration>): ReadonlyArray<Declaration> {
    return declarations.reduce((reduced: Declaration[], declaration: FunctionDeclaration, declarationIndex: number) => {
        if(declaration instanceof FunctionDeclaration) {
            let parameters = declaration.signature.parameters;
            let startOfOptionals = parameters.reduceRight((start, p, i) => p.isOptional ? i : start, parameters.length);
            for(let index = startOfOptionals; index < parameters.length; index++) {
                //skip adding overload if it already exists
                if(([...reduced, ...declarations.slice(declarationIndex + 1)]).some(
                    (m: FunctionDeclaration) => (declaration instanceof ConstructorDeclaration ? m instanceof ConstructorDeclaration : (m.constructor.name == 'FunctionDeclaration' && m.name === declaration.name)) && 
                        m.signature.parameters.length == index && m.signature.parameters.every(
                            (p, i) => i < index && p.type.typeName() === parameters[i].type.typeName()
                        )
                )) continue;
                const overload = Object.create(declaration, {
                    typeParameters: { value: declaration.typeParameters.map(t => Object.create(t)) },
                    signature: { value: Object.create(declaration.signature, {
                        parameters: { value: declaration.signature.parameters.slice(0, index).map(p => Object.create(p)) },
                        thrownTypes: { value: declaration.signature.thrownTypes.map(t => Object.create(t)) },
                        returnType: { value: Object.create(declaration.signature.returnType) }
                    })}
                });
                adopt(overload.typeParameters, overload);
                adopt(overload.signature.parameters, overload);
                adopt(overload.signature.returnType, overload);
                adopt(overload.signature.thrownTypes, overload);
                reduced.push(overload);
            }
        }
        reduced.push(declaration);
        return reduced;
    }, []);
}

function logErrorsForFunctionsWithSameErasure(declarations: ReadonlyArray<Declaration>) {
    declarations.forEach((declaration: FunctionDeclaration) => {
        if(declaration instanceof FunctionDeclaration) {
            let parameters = declaration.signature.parameters;
            const clashing = declarations.find((d: FunctionDeclaration) => {
                const isOverload = d != declaration && (declaration instanceof ConstructorDeclaration ? d instanceof ConstructorDeclaration : (d.constructor.name == 'FunctionDeclaration' && d.name === declaration.name));
                return isOverload && d.signature.parameters.length == parameters.length && d.signature.parameters.every((p, i) => 
                    p.type.erasure() === parameters[i].type.erasure()
                )
            }) as FunctionDeclaration;
            if(!clashing) return;
            const declarationSignature = `${declaration.declarationName()}(${declaration.signature.parameters.map(p => p.type.typeName()).join(', ')})`;
            const clashingSignature = `${clashing.declarationName()}(${clashing.signature.parameters.map(p => p.type.typeName()).join(', ')})`;
            log.error(`${declarationSignature} clashes with ${clashingSignature}, both methods have same erasure in Java`); 
            log.info(`Java Generics are implemented with Type Erasure and cannot support this overload, resolve this error by using different method names`);    
        }
    })    
}

