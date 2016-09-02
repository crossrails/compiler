import * as path from 'path';
import * as assert from 'assert';
import {log, Log} from "./log";

function adopt<Child extends { parent: any } | ReadonlyArray<{ parent: any }>>(child: Child, parent: any, propertyKey = 'parent'): Child {
    Array.isArray(child) ? child.forEach(element => adopt(element, parent, propertyKey)) :
        Object.defineProperty(child, propertyKey, {enumerable: false, writable: false, value: parent});
    return child;
}

export enum Flags {
    None = 0,
    Static = 1,
    Abstract = 2,
    Protected = 4,
    Constant = 8,
    Optional = 16,
    Thrown = 32
}

export abstract class Declaration {
    readonly name: string; 
    readonly flags: Flags;
    readonly comment: string
    readonly parent: Declaration;

    constructor(name: string, flags: Flags = Flags.None) {
        this.name = name;
        this.flags = flags;
    }

    get declaration(): Declaration {
        return this;
    }

    get module(): Module {
        return this.parent.module;
    }
    
    get sourceFile(): SourceFile {
        return this.parent.sourceFile;
    }

    get isStatic(): boolean {
        return this.parent == this.sourceFile || this.parent instanceof NamespaceDeclaration || (this.flags & Flags.Static) != 0;
    }

    get isAbstract(): boolean {
        return (this.flags & Flags.Abstract) != 0;
    }

    get isProtected(): boolean {
        return (this.flags & Flags.Protected) != 0;
    }
}

function adoptSignature(child: FunctionSignature, parent: Declaration|Type): FunctionSignature {
    adopt(child.parameters, parent);
    adopt(child.returnType, parent);
    adopt(child.thrownTypes, parent);
    return child;
}

export class FunctionSignature {
    readonly parameters: ReadonlyArray<ParameterDeclaration>
    readonly returnType: Type;
    readonly thrownTypes: ReadonlyArray<Type>

    constructor(parameters: ReadonlyArray<ParameterDeclaration>, returnType: Type | undefined, thrownTypes: ReadonlyArray<Type>) {
        this.parameters = parameters;
        this.returnType = returnType || new VoidType();
        this.thrownTypes = thrownTypes;
    }
}

export class FunctionDeclaration extends Declaration {
    readonly signature: FunctionSignature
    readonly typeParameters: ReadonlyArray<Type>

    constructor(name: string, flags: Flags, signature: FunctionSignature, typeParameters: ReadonlyArray<Type>) {
        super(name, flags);
        this.signature = adoptSignature(signature, this);
        this.typeParameters = adopt(typeParameters, this);
    }
}

export class ConstructorDeclaration extends FunctionDeclaration {
    constructor(flags: Flags, signature: FunctionSignature, typeParameters: ReadonlyArray<Type>) {
        super('', flags, signature, typeParameters);
    }

    get name(): string {
        throw new Error('Accessing name of constructor')
    }

    get parent(): TypeDeclaration {
        return super.parent as TypeDeclaration;
    }
}

export class VariableDeclaration extends Declaration {
    readonly type: Type;
    
    constructor(name: string, flags: Flags, type: Type) {
        super(name, flags);
        this.type = adopt(type, this);
    }

    get isConstant(): boolean {
        return (this.flags & Flags.Constant) != 0;
    }
}

export class ParameterDeclaration extends Declaration {
    readonly type: Type;
    
    constructor(name: string, flags: Flags, type: Type) {
        super(name, flags);
        this.type = adopt(type, this);
    }

    get isOptional(): boolean {
        return (this.flags & Flags.Optional) != 0;
    }

    get parent(): Declaration {
        return super.parent as Declaration;
    }
}

export abstract class TypeDeclaration extends Declaration {
    readonly declarations: ReadonlyArray<Declaration>
    
    constructor(name: string, flags: Flags, declarations: ReadonlyArray<Declaration>) {
        super(name, flags);
        this.declarations = adopt(declarations, this);
    }
}

export class InterfaceDeclaration extends TypeDeclaration {
    readonly typeParameters: ReadonlyArray<Type>
    
    constructor(name: string, flags: Flags, declarations: ReadonlyArray<Declaration>, typeParameters: ReadonlyArray<Type>) {
        super(name, flags, declarations);
        this.typeParameters = adopt(typeParameters, this);
    }
}

export class ClassDeclaration extends TypeDeclaration {
    readonly superClass: string|undefined;
    readonly typeParameters: ReadonlyArray<Type>
    
    constructor(name: string, flags: Flags, declarations: ReadonlyArray<Declaration>, typeParameters: ReadonlyArray<Type>) {
        super(name, flags, declarations);
        this.typeParameters = adopt(typeParameters, this);
    }
    
    get isThrown(): boolean {
        return (this.flags & Flags.Thrown) != 0;
    }
}

export class NamespaceDeclaration extends Declaration { 
    readonly declarations: ReadonlyArray<Declaration> 
     
    constructor(name: string, flags: Flags, declarations: ReadonlyArray<Declaration>) {
        super(name, flags);
        this.declarations = adopt(declarations, this);
    }     
} 
 
export class SourceFile extends Declaration {
    readonly path: path.ParsedPath;    
    readonly comment: string;  
    readonly declarations: ReadonlyArray<Declaration>
    readonly module: Module;
    
    constructor(name: string, declarations: ReadonlyArray<Declaration>) {
        super(name, Flags.None);
        this.path = path.parse(name);
        this.declarations = adopt(declarations, this);
    }
        
    get sourceFile(): SourceFile {
        return this;
    }
}

export class Module {
    readonly sourceRoot: string;
    readonly files: ReadonlyArray<SourceFile>;
    
    constructor(sourceRoot: string, files: ReadonlyArray<SourceFile>) {
        this.sourceRoot = sourceRoot;
        this.files = adopt(files, this, 'module');
        if(files.length == 0) {
            log.warn(`Nothing to output as no exported declarations found in the source files`);                
            log.info(`Resolve this warning by prefixing your declarations with the export keyword or a @export jsdoc tag or use the --implicitExport option`)
        }
    }   

    get declarations(): ReadonlyArray<Declaration> {
        return this.files.reduce<Declaration[]>((reduced, file) => [...reduced, ...file.declarations], []) 
    }

    get identifiers(): ReadonlyArray<Declaration> {
        return [];//this.declarations.map(declaration => declaration.name);
    }
}

export abstract class Type {
    readonly flags: Flags
    readonly parent: Declaration|Type
    
    constructor(flags: Flags = Flags.None) {
        this.flags = flags;
    }

    get isOptional(): boolean {
        return (this.flags & Flags.Optional) != 0;
    }

    get declaration(): Declaration {
        return this.parent.declaration;
    }

    // private static fromComment(type: Comment.Tag.Type, parent: Declaration, context: Context): Type {
    //     switch(type.type) {
    //         case 'NameExpression':
    //             switch(type.name) {
    //                 case 'boolean':
    //                     return new BooleanType(false, parent);
    //                 case 'number':
    //                     return new NumberType(false, parent);
    //                 case 'string':
    //                     return new StringType(false, parent);
    //                 case 'Error':
    //                     return new ErrorType(false, parent);
    //                 default:
    //                     return new DeclaredType(type, false, parent, factory);
    //             }
    //     }
    //     return new AnyType(false, parent);
    // }

    // static returnedFrom(signature: ts.Signature, optional: boolean, parent: Declaration, context: Context) {
    //     return Type.create(context.checker.getReturnTypeOfSignature(signature), optional, parent, context);        
    // }
        
    // static of(symbol: ts.Symbol, optional: boolean, parent: Declaration, context: Context): Type {
    //     const type = context.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!);
    //     if(!type) {
    //         log.warn(`Type information missing for ${ts.SyntaxKind[symbol.valueDeclaration!.kind]}, resorting to Any`, symbol.valueDeclaration!);
    //         log.info(`Resolve this warning by adding a typescript type annotation or a @returns jsdoc tag`, symbol.valueDeclaration!)
    //     } else try {
    //         return Type.create(type, optional, parent, context);
    //     } catch(error) {
    //         if(typeof error !== 'string') throw error;
    //         log.warn(`${error}, erasing to Any`, symbol.valueDeclaration);
    //         log.info(`This type is not supported by crossrails`, symbol.valueDeclaration)
    //     }
    //     return new AnyType(false, parent);
    // }

    // protected static create(type: ts.Type, optional: boolean, parent: Declaration, context: Context): Type {
    //     let flags = `Flags of type ${context.checker.typeToString(type)} are`
    //     for(let i=1; i < (1<<30); i = i << 1) {
    //         if(type.flags & i) flags = `${flags} ${ts.TypeFlags[i]}`
    //     }
    //     console.log(flags);
    //     switch(type.flags) {
    //         case ts.TypeFlags.Void:
    //             return new VoidType(parent);
    //         case ts.TypeFlags.Any:
    //             return new AnyType(optional, parent);
    //         case ts.TypeFlags.Boolean:
    //             return new BooleanType(optional, parent);
    //         case ts.TypeFlags.Number:
    //             return new NumberType(optional, parent);
    //         case ts.TypeFlags.String:
    //             return new StringType(optional, parent);
    //         case ts.TypeFlags.Narrowable:
    //             return new FunctionType(context.checker.getSignaturesOfType(type, ts.SignatureKind.Call)[0], optional, parent, context);
    //         case ts.TypeFlags.Reference:
    //             return Type.fromReference(type as ts.TypeReference, optional, parent, context);
    //         case ts.TypeFlags.Union:
    //             return Type.fromUnion(type as ts.UnionType, parent, context);
    //         default:
    //             throw `Unsupported type ${ts.TypeFlags[type.flags]}`;                
    //     }
    // }
    
    // static fromReference(reference: ts.TypeReference, optional: boolean, parent: Declaration, context: Context) {
    //     switch(reference.symbol!.name) {
    //         case 'Object':
    //             return new AnyType(optional, parent);
    //         case 'Date':
    //             return new DateType(optional, parent);
    //         case 'Error':
    //             return new ErrorType(optional, parent);
    //         case 'Array':
    //         case 'ReadonlyArray':
    //             return new ArrayType(reference.typeArguments, optional, parent, factory);
    //         default:
    //             return new DeclaredType(reference, optional, parent, factory);
    //     }
    // }
        
    // static fromUnion(union: ts.UnionType, parent: Declaration, context: Context) {
    //     if(union.types.length == 2) {
    //         if(union.types[0].flags == ts.TypeFlags.Null || union.types[0].flags ==  ts.TypeFlags.Undefined) {
    //             return Type.create(union.types[1], true, parent, context);
    //         } else if(union.types[1].flags == ts.TypeFlags.Null || union.types[1].flags == ts.TypeFlags.Undefined) {
    //             return Type.create(union.types[0], true, parent, context);                        
    //         }
    //     }
    //     throw `Unsupported type union, only unions between null or undefined and a single type supported`
    // }  
}  

export class FunctionType extends Type {
    readonly signature: FunctionSignature
    
    constructor(flags: Flags, signature: FunctionSignature) {
        super(flags);
        this.signature = adoptSignature(signature, this);

// =======
//     constructor(signature: ts.Signature, optional: boolean, parent: Declaration, context: Context) {
//         super(optional, parent);
//         // context.queue(() => {
//         //     //todo support @callback tags
//         //     this._signature = new FunctionSignature(signature, new Comment(signature.getDocumentationComment()), parent, context);
//         // });
// >>>>>>> Stashed changes
    }  
}       

export abstract class GenericType extends Type {
    readonly typeArguments: ReadonlyArray<Type>

    
    constructor(flags: Flags, typeArguments: ReadonlyArray<Type>) {
        super(flags);
// =======
//     constructor(typeArgs: ts.Type[] | undefined, optional: boolean, parent: Declaration, context: Context) {
//         super(optional, parent);
//         let typeArguments: Type[] = [];
//         if(typeArgs) for (let typeArg of typeArgs) {
//             typeArguments.push(Type.create(typeArg, false, parent, context))
//         }
// >>>>>>> Stashed changes
        this.typeArguments = adopt(typeArguments, this);      
    }  
}

export class DeclaredType extends GenericType {
    readonly name: string

    constructor(flags: Flags, typeArguments: ReadonlyArray<Type>, name: string) {
        super(flags, typeArguments);
        this.name = name;
// =======
//     private _declaration?: TypeDeclaration
//     readonly name: string|undefined

//     constructor(type: ts.TypeReference | Comment.Tag.Type, optional: boolean, parent: Declaration, context: Context) {
//         if(DeclaredType.isTypeReference(type)) {
//             super(type.typeArguments, optional, parent, context);
//             this.name = context.checker.typeToString(type);
//         } else {
//             super([], optional, parent, context);
//             this.name = type.name;
//         }    
//         context.queue(() => {
//             // this._declaration = context.typeDeclarations.get(this.name);
//             // if(!this._declaration) {
//             //     let msg = `Cannot find type ${this.name.elements.join('.')}`;
//             //     if(DeclaredType.isTypeReferenceNode(type)) {
//             //         log.error(msg, type);
//             //     } else {
//             //         log.error(msg, type.node, type.lineNumber);
//             //     }
//             //     log.info(`Resolve this error by adding the source for ${this.name.elements.join('.')} to the input file otherwise output will not compile standalone`)
//             // }
//         })
//     }     

//     private static isTypeReference(type: ts.TypeReference|Comment.Tag.Type): type is ts.TypeReference {
//         return (type as ts.TypeReference).flags !== undefined;
// >>>>>>> Stashed changes
    }

    get isAbstract(): boolean {
        return (this.flags & Flags.Abstract) != 0;
    }

}

export class VoidType extends Type {
}

export class DateType extends Type { 
} 

export class ErrorType extends Type {
}

export class AnyType extends Type {
}

export class StringType extends Type {
}

export class NumberType extends Type {
}

export class BooleanType extends Type {
}

export class ArrayType extends GenericType {
}
