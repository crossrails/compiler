import * as path from 'path';
import * as assert from 'assert';
import * as doctrine from 'doctrine';
import * as ts from "typescript";
import {log, Log} from "./log";

export interface Factory {
    createChildren<T extends Declaration>(node: ts.Node, parent: Declaration|SourceFile): T[];
    createType<T>(node: ts.Node, parent: Declaration|SourceFile): T;
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

export abstract class Declaration {
    readonly name: string; 
    readonly parent: Declaration|SourceFile;

    constructor(node: ts.Declaration, parent: Declaration|SourceFile) {
        //make parent non-enumerable to avoid circular reference 
        Object.defineProperty(this, 'parent', { enumerable: false, writable: false, value: parent});
        if(node.name) {
            this.name = (node.name as ts.Identifier).text;
        }
    }

    get module(): Module {
        return this.parent.module;
    }
    
    get sourceFile(): SourceFile {
        return this.parent.sourceFile;
    }
}

export abstract class MemberDeclaration extends Declaration {
    readonly comment: string
    readonly protected: boolean;
    readonly static: boolean;
    readonly abstract: boolean

    constructor(node: ts.Declaration, parent: Declaration|SourceFile, comment = new Comment(node)) {
        super(node, parent);
        this.protected = (node.flags & ts.NodeFlags.Protected) != 0 || comment.isTagged('protected') || comment.isTagged('access', 'protected');
        this.static =  parent == this.sourceFile || node.parent!.kind == ts.SyntaxKind.ModuleBlock || (node.kind == ts.SyntaxKind.VariableDeclaration && node.parent!.parent!.parent!.kind == ts.SyntaxKind.ModuleBlock) || (node.flags & ts.NodeFlags.Static) != 0 || comment.isTagged('static');
        this.abstract = node.parent!.kind == ts.SyntaxKind.InterfaceDeclaration || (node.flags & ts.NodeFlags.Abstract) != 0 || comment.isTagged('abstract') || comment.isTagged('virtual');
    }
}

export class FunctionSignature {
    readonly parameters: ReadonlyArray<ParameterDeclaration>
    readonly returnType: Type;
    readonly thrownTypes: Type[];

    constructor(node: ts.SignatureDeclaration, parent: Declaration, factory: Factory, comment = new Comment(node)) {
        if(node.type) {
            this.returnType = factory.createType(node.type, false, parent);
        } else if(!(parent instanceof ConstructorDeclaration)) {
            log.warn(`Return type information missing, assuming void`, node);
            log.info(`Resolve this warning by adding a typescript type annotation or a @returns jsdoc tag`, node)
            this.returnType = new VoidType(parent);
        } 
        this.parameters = factory.createChildren<ParameterDeclaration>(node, parent);
        this.thrownTypes = comment.tagsNamed('throws').map(tag => {
            return !tag.type ? new AnyType(false, parent) : Type.fromComment(tag.type, parent, factory);
        });
    }
}

export class FunctionDeclaration extends MemberDeclaration {
    readonly signature: FunctionSignature
    readonly typeParameters: ReadonlyArray<Type>

    constructor(node: ts.SignatureDeclaration, parent: Declaration|SourceFile, factory: Factory) {
        const comment = new Comment(node);
        super(node, parent, comment);
        this.signature = new FunctionSignature(node, this, factory, comment);
    }
}

export class ConstructorDeclaration extends FunctionDeclaration {
    constructor(node: ts.ConstructorDeclaration, parent: Declaration|SourceFile, factory: Factory) {
        super(node, parent, factory);
    }

    get name(): string {
        throw new Error('Accessing name of constructor')
    }

    get parent(): TypeDeclaration {
        return super.parent as TypeDeclaration;
    }
}

export class VariableDeclaration extends MemberDeclaration {
    readonly type: Type;
    readonly constant: boolean;
    
    constructor(node: ts.VariableDeclaration, parent: Declaration|SourceFile, factory: Factory) {
        super(node, parent);
        this.constant = (node.parent && node.parent.flags & ts.NodeFlags.Const) != 0
        if(node.type) {
            this.type = factory.createType(node.type, false, this);
        } else {
            log.warn(`Type information missing for variable declaration, resorting to Any`, node);
            log.info(`Resolve this warning by adding a typescript type annotation or a @returns jsdoc tag`, node)
            this.type = new AnyType(false, this);
        } 
    }    
}

export class ParameterDeclaration extends Declaration {
    readonly type: Type;
    readonly parent: Declaration;
    readonly optional: boolean;
    
    constructor(node: ts.ParameterDeclaration, parent: Declaration, factory: Factory) {
        super(node, parent);
        this.optional = node.questionToken !== undefined;
        if(node.type) {
            this.type = factory.createType(node.type, false, this);
        } else {
            log.warn(`Type information missing for function parameter, resorting to Any`, node);
            log.info(`Resolve this warning by adding a typescript type annotation or a @param jsdoc tag`, node)
            this.type = new AnyType(false, this);
        } 
    }    
}

export abstract class TypeDeclaration extends MemberDeclaration {
    readonly declarations: ReadonlyArray<MemberDeclaration>;
    
    constructor(nodes: ReadonlyArray<ts.Declaration>, parent: Declaration|SourceFile, factory: Factory) {
        super(nodes[0], parent);
        this.declarations = nodes.reduce((reduced, node) => [...reduced, ...factory.createChildren<MemberDeclaration>(node, this)], [] as MemberDeclaration[]);
    }
}

export class InterfaceDeclaration extends TypeDeclaration {
    readonly typeParameters: ReadonlyArray<Type>
    
    constructor(nodes: ReadonlyArray<ts.Declaration>, parent: Declaration|SourceFile, factory: Factory) {
        super(nodes, parent, factory);
    }
}

export class ClassDeclaration extends TypeDeclaration {
    readonly isThrown: boolean;
    readonly superClass: string|undefined;
    readonly typeParameters: ReadonlyArray<Type>
    
    constructor(nodes: ReadonlyArray<ts.Declaration>, isThrown: boolean, parent: Declaration|SourceFile, factory: Factory) {
        super(nodes, parent, factory);
        this.isThrown = isThrown;
    }
}

export class NamespaceDeclaration extends Declaration { 
    readonly declarations: ReadonlyArray<Declaration> 
     
    constructor(nodes: ReadonlyArray<ts.ModuleDeclaration>, parent: Declaration|SourceFile, factory: Factory) { 
        super(nodes[0], parent); 
        this.declarations = nodes.reduce((reduced, node) => [...reduced, ...factory.createChildren(node, this)], [] as Declaration[]);
    }     
} 
 

export class SourceFile {
    readonly path: path.ParsedPath;    
    readonly comment: string;  
    readonly declarations: ReadonlyArray<Declaration>
    readonly module: Module;
    
    constructor(node: ts.SourceFile, module: Module, factory: Factory) {
        // console.log(JSON.stringify(ts.createSourceFile(node.fileName, readFileSync(node.fileName).toString(), ts.ScriptTarget.ES6, false), (key, value) => {
        //     return value ? Object.assign(value, { kind: ts.SyntaxKind[value.kind], flags: ts.NodeFlags[value.flags] }) : value;
        // }, 4));
        this.path = path.parse(node.fileName);
        Object.defineProperty(this, 'module', { enumerable: false, writable: false, value: module});
        this.declarations = factory.createChildren(node, this);
    }
        
    get sourceFile(): SourceFile {
        return this;
    }
}

export class Module {
    readonly sourceRoot: string;
    readonly files: ReadonlyArray<SourceFile>;
    readonly identifiers: ReadonlyArray<Declaration>;
    
    constructor(program: ts.Program, sourceRoot: string, factory: Factory) {
        this.sourceRoot = sourceRoot;
        let files: SourceFile[] = [];
        for (let file of program.getSourceFiles()) {
            if(path.relative(this.sourceRoot, file.path).startsWith('..')) continue;
            log.info(`Parsing ${path.relative('.', file.path)}`);
            let sourceFile = new SourceFile(file, this, factory);
            if(sourceFile.declarations.length) {
                files.push(sourceFile);
            } else {
                log.info(`No exported declarations found in ${path.relative('.', file.path)}`);            
            }
        }
        this.files = files;
        if(files.length == 0) {
            log.warn(`Nothing to output as no exported declarations found in the source files`);                
            log.info(`Resolve this warning by prefixing your declarations with the export keyword or a @export jsdoc tag or use the --implicitExport option`)
        }
        //this.identifiers = factory.finalize();
    }   

    get declarations(): ReadonlyArray<MemberDeclaration> {
        return this.files.reduce((declarations: MemberDeclaration[], file: SourceFile) => 
            declarations.concat(file.declarations as MemberDeclaration[]), []);
    }
}

export abstract class Type {
    readonly optional: boolean
    readonly parent: Declaration
    
    constructor(optional: boolean, parent: Declaration) {
        this.optional = optional;
        this.parent = parent;
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
    
    constructor(type: ts.FunctionTypeNode, optional: boolean, parent: Declaration, factory: Factory) {
        super(optional, parent);
        //todo support @callback tags
        this.signature = new FunctionSignature(type, parent, factory);
    }  
}       

export abstract class GenericType extends Type {
    readonly typeArguments: ReadonlyArray<Type>
    
    constructor(typeArgs: ts.TypeNode[] | undefined, optional: boolean, parent: Declaration, factory: Factory) {
        super(optional, parent);
        let typeArguments: Type[] = [];
        if(typeArgs) for (let typeArg of typeArgs) {
            typeArguments.push(factory.createType(typeArg, false, parent, factory))
        }
        this.typeArguments = typeArguments;      
    }  
}       

export class DeclaredType extends GenericType {
    readonly name: string
    readonly abstract: boolean

    constructor(name: string, typeArgs: ts.TypeNode[] | undefined, abstract: boolean, optional: boolean, parent: Declaration, factory: Factory) {
        super(typeArgs, optional, parent, factory);
        this.name = name;
        this.abstract = abstract;
    }     
}

export class VoidType extends Type {
    constructor(parent: Declaration) {
        super(false, parent);
    }
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
