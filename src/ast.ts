import * as path from 'path';
import * as assert from 'assert';
import * as doctrine from 'doctrine';
import * as ts from "typescript";
import {log, Log} from "./log";

function adopt<T>(child: T, parent: any, propertyKey = 'parent'): T {
    Array.isArray(child) ? child.forEach(element => adopt(element, parent, propertyKey)) :
        Object.defineProperty(child, propertyKey, {enumerable: false, writable: false, value: parent});
    return child;
}

namespace Comment {
    export type Tag = doctrine.Tag & {node: ts.Node, type: Tag.Type}
    export namespace Tag {
        export type Type = doctrine.Type & {node: ts.Node}
    }
}

export class Comment {
    private readonly tags: Map<string, Comment.Tag[]> = new Map();

    readonly description: string = '';

    constructor(node: ts.Node) {
        let text = node.getFullText();
        let comment = (ts.getLeadingCommentRanges(text, 0) || []).pop();
        if(comment) {
            let parsed = doctrine.parse(text.substring(comment.pos, comment.end), {unwrap : true, lineNumbers: true});
            this.description = parsed.description;
            for(let tag of parsed.tags) {
                tag['node'] = node;
                if(tag.type) {
                    tag.type['node'] = node;
                }
                this.tags.set(tag.title, [tag as Comment.Tag, ...(this.tags.get(tag.title) || [])]);
            }
        }
    }

    isTagged(title: string, value?: string): boolean {
        let tags = this.tags.get(title);
        return tags != undefined && (!value || tags.some(tag => tag[title] == value));
    }

    tagsNamed(title: string): Comment.Tag[] {
        return this.tags.get(title) || [];
    }
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
    }

    get module(): Module {
        return this.parent.module;
    }
    
    get sourceFile(): SourceFile {
        return this.parent.sourceFile;
    }

    get isStatic(): boolean {
        return (this.flags & Flags.Static) != 0;
    }

    get isAbstract(): boolean {
        return (this.flags & Flags.Abstract) != 0;
    }

    get isProtected(): boolean {
        return (this.flags & Flags.Protected) != 0;
    }
}

function adoptSignature(child: FunctionSignature, parent: Declaration): FunctionSignature {
    adopt(child.parameters, parent);
    adopt(child.returnType, parent);
    adopt(child.thrownTypes, parent);
    return child;
}

export class FunctionSignature {
    readonly parameters: ReadonlyArray<ParameterDeclaration>
    readonly returnType: Type;
    readonly thrownTypes: ReadonlyArray<Type>

    constructor(parameters: ReadonlyArray<ParameterDeclaration>, returnType: Type, thrownTypes: ReadonlyArray<Type>) {
        this.parameters = parameters;
        this.returnType = returnType;
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
    readonly constant: boolean;
    
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
    readonly parent: Declaration
    
    constructor(flags: Flags) {
        this.flags = flags;
    }

    get isOptional(): boolean {
        return (this.flags & Flags.Optional) != 0;
    }

    // private static fromComment(type: Comment.Tag.Type, parent: Declaration, factory: Factory): Type {
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
        
    // private static from(type: ts.TypeNode, optional: boolean, parent: Declaration, factory: Factory): Type {
    //     try {
    //         switch(type.kind) {
    //             case ts.SyntaxKind.VoidKeyword:
    //                 return new VoidType(parent);
    //             case ts.SyntaxKind.AnyKeyword:
    //                 return new AnyType(optional, parent);
    //             case ts.SyntaxKind.BooleanKeyword:
    //                 return new BooleanType(optional, parent);
    //             case ts.SyntaxKind.NumberKeyword:
    //                 return new NumberType(optional, parent);
    //             case ts.SyntaxKind.StringKeyword:
    //                 return new StringType(optional, parent);
    //             case ts.SyntaxKind.ArrayType:
    //                 return new ArrayType([(type as ts.ArrayTypeNode).elementType], optional, parent, factory);
    //             case ts.SyntaxKind.FunctionType:
    //                 return new FunctionType(type as ts.FunctionTypeNode, optional, parent, factory);
    //             case ts.SyntaxKind.TypeReference:   
    //                 return Type.fromReference(type as ts.TypeReferenceNode, optional, parent, factory);
    //             case ts.SyntaxKind.UnionType:
    //                 return Type.fromUnion(type as ts.UnionTypeNode, parent, factory);
    //             default:
    //                 throw `Unsupported type ${ts.SyntaxKind[type.kind]}`;                
    //         }
    //     } catch(error) {
    //         if(typeof error !== 'string') throw error;
    //         log.warn(`${error}, erasing to Any`, type);
    //         log.info(`This type is not supported by crossrails`, type)
    //         return new AnyType(optional, parent);
    //     }
    // }
    
    // static fromReference(reference: ts.TypeReferenceNode, optional: boolean, parent: Declaration, factory: Factory) {
    //     let identifier = reference.typeName as ts.Identifier
    //     switch(identifier.text) {
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
        
    // static fromUnion(union: ts.UnionTypeNode, parent: Declaration, factory: Factory) {
    //     if(union.types.length == 2) {
    //         if(union.types[0].kind == ts.SyntaxKind.NullKeyword || union.types[0].kind == ts.SyntaxKind.UndefinedKeyword) {
    //             return Type.from(union.types[1], true, parent, factory);
    //         } else if(union.types[1].kind == ts.SyntaxKind.NullKeyword || union.types[1].kind == ts.SyntaxKind.UndefinedKeyword) {
    //             return Type.from(union.types[0], true, parent, factory);                        
    //         }
    //     }
    //     throw `Unsupported type union, only unions between null or undefined and a single type supported`
    // }  
}  

export class FunctionType extends Type {
    readonly signature: FunctionSignature
    
    constructor(flags: Flags, signature: FunctionSignature) {
        super(flags);
        this.signature = signature
    }  
}       

export abstract class GenericType extends Type {
    readonly typeArguments: ReadonlyArray<Type>
    
    constructor(flags: Flags, typeArguments: ReadonlyArray<Type>) {
        super(flags);
        this.typeArguments = typeArguments;      
    }  
}       

export class DeclaredType extends GenericType {
    readonly name: string

    constructor(flags: Flags, typeArguments: ReadonlyArray<Type>, name: string) {
        super(flags, typeArguments);
        this.name = name;
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
