import {readFileSync, accessSync, R_OK} from 'fs';
import * as path from 'path';
import * as assert from 'assert';
import * as doctrine from 'doctrine';
import * as ts from "typescript";
import {log, Log} from "./log"

export class Context { 
    private readonly queued: Array<() => void> = []; 
    private readonly typeChecker: ts.TypeChecker;
    readonly typeDeclarations: Map<string, TypeDeclaration> = new Map();
    readonly thrownTypes: Set<string> = new Set(); 
    readonly identifiers: Set<Declaration> = new Set();
 
    constructor(program: ts.Program) { 
        this.typeChecker = program.getTypeChecker(); 
    } 
 
    queue(job: () => void) { 
        this.queued.push(job); 
    } 
 
    finalize(): ReadonlyArray<Declaration> { 
        this.queued.forEach(f => f()); 
        return Array.from(this.identifiers);
    } 

    declarationsFor(declaration: ts.Declaration): ts.Declaration[] {
        if(declaration.name === undefined) return [declaration];
        const symbol = this.typeChecker.getSymbolAtLocation(declaration.name);
        return symbol ? symbol.declarations! : [declaration];        
    }
 
    createDeclarations<T extends Declaration>(node: ts.Node, comment: Comment, parent: Declaration|SourceFile): T[] {
        let declarations = this.declarationsFor(node as ts.Declaration);
        let created: Declaration[] = [];
        if(node == declarations.reduce((main, d) => !main || (main.kind == ts.SyntaxKind.ModuleDeclaration && d.kind != ts.SyntaxKind.ModuleDeclaration) ? d : main)) switch(node.kind) {
            case ts.SyntaxKind.VariableStatement:
                created.push(...(node as ts.VariableStatement).declarationList.declarations.map(d => this.createDeclarations(d, comment, parent)[0]));
                break;   
            case ts.SyntaxKind.VariableDeclaration:
            case ts.SyntaxKind.PropertyDeclaration:
            case ts.SyntaxKind.PropertySignature:
                created.push(new VariableDeclaration(node as ts.VariableDeclaration, comment, parent, this));
                break;
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.MethodSignature:
                created.push(new FunctionDeclaration(node as ts.SignatureDeclaration, comment, parent, this));
                break;                
            case ts.SyntaxKind.ClassDeclaration:
                created.push(new ClassDeclaration(node as ts.ClassDeclaration, comment, parent, this));
                break;
            case ts.SyntaxKind.InterfaceDeclaration:
                created.push(new InterfaceDeclaration(node as ts.InterfaceDeclaration, comment, parent, this));
                break;
            case ts.SyntaxKind.Constructor:
                created.push(new ConstructorDeclaration(node as ts.ConstructorDeclaration, comment, parent, this));
                break;
            case ts.SyntaxKind.ModuleDeclaration:
                created.push(new NamespaceDeclaration(node as ts.ModuleDeclaration, comment, parent, this));
                break;
            default:
                log.warn(`Skipping ${ts.SyntaxKind[node.kind]} named ${(declarations[0].name as ts.Identifier || {text:"\b"}).text}`, node);
                log.info(`This syntax element is not currently support by crossrails`, node)
        }     
        return created as T[];       
    } 
    
}

namespace Comment {
    export type Tag = doctrine.Tag & {node: ts.Node, type: Tag.Type}
    export namespace Tag {
        export type Type = doctrine.Type & {node: ts.Node}
    }
}

class Comment {
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

    constructor(node: ts.Declaration, comment: Comment, parent: Declaration|SourceFile, context: Context) {
        super(node, parent);
        this.protected = (node.flags & ts.NodeFlags.Protected) != 0 || comment.isTagged('protected') || comment.isTagged('access', 'protected');
        this.static =  parent == this.sourceFile || node.parent!.kind == ts.SyntaxKind.ModuleBlock || (node.kind == ts.SyntaxKind.VariableDeclaration && node.parent!.parent!.parent!.kind == ts.SyntaxKind.ModuleBlock) || (node.flags & ts.NodeFlags.Static) != 0 || comment.isTagged('static');
        this.abstract = node.parent!.kind == ts.SyntaxKind.InterfaceDeclaration || (node.flags & ts.NodeFlags.Abstract) != 0 || comment.isTagged('abstract') || comment.isTagged('virtual');
        if(node.name) {
            context.identifiers.add(this);
        }
    }
}

export class FunctionSignature {
    readonly parameters: ReadonlyArray<ParameterDeclaration>
    readonly returnType: Type;
    readonly thrownTypes: Type[];

    constructor(node: ts.SignatureDeclaration, comment: Comment, parent: Declaration, context: Context) {
        if(node.type) {
            this.returnType = Type.from(node.type, false, parent, context);
        } else if(!(parent instanceof ConstructorDeclaration)) {
            log.warn(`Return type information missing, assuming void`, node);
            log.info(`Resolve this warning by adding a typescript type annotation or a @returns jsdoc tag`, node)
            this.returnType = new VoidType(parent);
        } 
        let parameters: ParameterDeclaration[] = [];
        for(let parameter of node.parameters) {
            parameters.push(new ParameterDeclaration(parameter, parent, context));
        }
        this.parameters = parameters;
        let thrownTypes: Type[] = [];
        for(let tag of comment.tagsNamed('throws')) {
            if(!tag.type) {
                thrownTypes.push(new AnyType(false, parent))
            } else {
                thrownTypes.push(Type.fromComment(tag.type, parent, context))
                context.thrownTypes.add(tag.type.name!);
            }
        }
        this.thrownTypes = thrownTypes;
    }
}

export class FunctionDeclaration extends MemberDeclaration {
    readonly signature: FunctionSignature
    readonly typeParameters: ReadonlyArray<Type>

    constructor(node: ts.SignatureDeclaration, comment: Comment, parent: Declaration|SourceFile, context: Context) {
        super(node, comment, parent, context);
        this.signature = new FunctionSignature(node, comment, this, context);
    }
}

export class ConstructorDeclaration extends FunctionDeclaration {
    constructor(node: ts.ConstructorDeclaration, comment: Comment, parent: Declaration|SourceFile, context: Context) {
        super(node, comment, parent, context);
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
    
    constructor(node: ts.VariableDeclaration, comment: Comment, parent: Declaration|SourceFile, context: Context) {
        super(node, comment, parent, context);
        if(node.type) {
            this.type = Type.from(node.type, false, this, context);
        } else {
            log.warn(`Type information missing for variable declaration, resorting to Any`, node);
            log.info(`Resolve this warning by adding a typescript type annotation or a @returns jsdoc tag`, node)
            this.type = new AnyType(false, this);
        } 
        this.constant = (node.parent && node.parent.flags & ts.NodeFlags.Const) != 0
    }    
}

export class ParameterDeclaration extends Declaration {
    readonly type: Type;
    readonly parent: Declaration;
    readonly optional: boolean;
    
    constructor(node: ts.ParameterDeclaration, parent: Declaration, context: Context) {
        super(node, parent);
        this.optional = node.questionToken !== undefined;
        if(node.type) {
            this.type = Type.from(node.type, false, this, context);
        } else {
            log.warn(`Type information missing for function parameter, resorting to Any`, node);
            log.info(`Resolve this warning by adding a typescript type annotation or a @param jsdoc tag`, node)
            this.type = new AnyType(false, this);
        } 
    }    
}

export abstract class TypeDeclaration extends MemberDeclaration {
    readonly members: ReadonlyArray<MemberDeclaration>;
    
    constructor(node: ts.ClassDeclaration|ts.InterfaceDeclaration|ts.EnumDeclaration, comment: Comment, parent: Declaration|SourceFile, context: Context) {
        super(node, comment, parent, context);
        let members: MemberDeclaration[] = [];
        for(let declaration of context.declarationsFor(node)) {
            switch(declaration.kind) {
                case ts.SyntaxKind.ModuleDeclaration:
                    const namespace = new NamespaceDeclaration(declaration as ts.ModuleDeclaration, comment, parent, context);
                    members.push(...namespace.declarations as MemberDeclaration[]);
                    break;
                default:
                    for (let member of (declaration as ts.ClassDeclaration|ts.InterfaceDeclaration|ts.EnumDeclaration).members) {
                        let comment = new Comment(member);
                        if(member.flags & ts.NodeFlags.Private || comment.isTagged('private') || comment.isTagged('access', 'private')) {
                            log.debug(`Skipping private ${ts.SyntaxKind[member.kind]} named ${(member.name as ts.Identifier || {text:"\b"}).text} of class ${this.name}`, member);
                            continue;                
                        }      
                        members.push(...context.createDeclarations<MemberDeclaration>(member, comment, this));
                    }
            }
        }
        this.members = members;
        context.typeDeclarations.set(this.name, this);
    }
}

export class InterfaceDeclaration extends TypeDeclaration {
    readonly typeParameters: ReadonlyArray<Type>
    
    constructor(node: ts.InterfaceDeclaration, comment: Comment, parent: Declaration|SourceFile, context: Context) {
        super(node, comment, parent, context);
    }
}

export class ClassDeclaration extends TypeDeclaration {
    private _isThrown: boolean;
    readonly superClass: string|undefined;
    readonly typeParameters: ReadonlyArray<Type>
    
    constructor(node: ts.ClassDeclaration, comment: Comment, parent: Declaration|SourceFile, context: Context) {
        super(node, comment, parent, context);
        context.queue(() => {
            this._isThrown = context.thrownTypes.has(this.name); 
        });
    }

    get isThrown(): boolean {
        return this._isThrown
    }
}

export class NamespaceDeclaration extends Declaration { 
    readonly declarations: ReadonlyArray<Declaration> 
    readonly module: Module; 
     
    constructor(node: ts.ModuleDeclaration, comment: Comment, parent: Declaration|SourceFile, context: Context) { 
        super(node, parent); 
        let declarations: Declaration[] = [];
        for(let declaration of context.declarationsFor(node) as ts.ModuleDeclaration[]) {
            const body = declaration.body as ts.ModuleBlock;
            if(body.statements) for (let statement of body.statements) {
                let comment = new Comment(statement);
                if(!(statement.flags & ts.NodeFlags.Export) && !comment.isTagged('export')) {
                    log.debug(`Skipping unexported ${ts.SyntaxKind[statement.kind]} in namspace ${this.name}`, statement);
                    continue;                
                } 
                declarations.push(...context.createDeclarations(statement, comment, this));
            }
        }
        this.declarations = declarations;
    }     
} 
 

export class SourceFile {
    readonly path: path.ParsedPath;    
    readonly comment: string;  
    readonly declarations: ReadonlyArray<Declaration>
    readonly module: Module;
    
    constructor(node: ts.SourceFile, implicitExport: boolean, module: Module, context: Context) {
        // console.log(JSON.stringify(ts.createSourceFile(node.fileName, readFileSync(node.fileName).toString(), ts.ScriptTarget.ES6, false), (key, value) => {
        //     return value ? Object.assign(value, { kind: ts.SyntaxKind[value.kind], flags: ts.NodeFlags[value.flags] }) : value;
        // }, 4));
        this.path = path.parse(node.fileName);
        Object.defineProperty(this, 'module', { enumerable: false, writable: false, value: module});
        let declarations: Declaration[] = [];
        for (let statement of node.statements) {
            let comment = new Comment(statement);
            if(!implicitExport && !(statement.flags & ts.NodeFlags.Export) && !comment.isTagged('export')) {
                log.debug(`Skipping unexported ${ts.SyntaxKind[statement.kind]}`, statement);
                continue;                
            } 
            declarations.push(...context.createDeclarations(statement, comment, this));
        }
        this.declarations = declarations;
    }
        
    get sourceFile(): SourceFile {
        return this;
    }
}

export class Module {

    readonly name: string;    
    readonly src: path.ParsedPath;
    readonly sourceRoot: string;
    readonly files: ReadonlyArray<SourceFile>;
    readonly identifiers: ReadonlyArray<Declaration>;
    
    constructor(src: string, sourceMapFile: string|undefined, declarationFile: string|undefined, typings: string|undefined, implicitExport: boolean, charset: string) {
        this.src = path.parse(src);
        this.name = this.src.name;
        let sourceMap = this.mapSources(src, sourceMapFile, declarationFile, typings, charset);
        this.sourceRoot = sourceMap.sourceRoot;
        let program = ts.createProgram(sourceMap.sources.map((s) => path.join(this.sourceRoot, s)), {allowJs: true, strictNullChecks: true, charset: charset});
        //diagnostics = diagnostics.concat(program.getGlobalDiagnostics()).concat(program.getOptionsDiagnostics()).concat(program.getDeclarationDiagnostics()).concat(program.getSemanticDiagnostics()).concat(program.getSyntacticDiagnostics());
        log.logDiagnostics(ts.getPreEmitDiagnostics(program));
        let context = new Context(program);
        let files: SourceFile[] = [];
        for (let file of program.getSourceFiles()) if(!path.relative(this.sourceRoot, file.path).startsWith('..')) {
            log.info(`Parsing ${path.relative('.', file.path)}`);
            let sourceFile = new SourceFile(file, implicitExport, this, context);
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
        ;
        this.identifiers = context.finalize();
    }   

    private mapSources(src: string, sourceMapFile: string|undefined, declarationFile: string|undefined, typings: string|undefined, charset: string) : {sourceRoot: string, sources: string[]} {
        if(sourceMapFile || !declarationFile) try {                
            let sourceMap = sourceMapFile || `${src}.map`;
            log.debug(`Attempting to open sourcemap at ${path.relative('.', sourceMap)}`);
            let map = JSON.parse(readFileSync(sourceMap, charset));
            map.sourceRoot = path.join(path.dirname(src), map.sourceRoot); 
            log.debug(`Sourcemap found with ${map.sources.length} source(s)`);
            return map;
        } catch(error) {
            if(sourceMapFile || error.code != 'ENOENT') {
                throw error;
            }
            log.info(`No sourcemap found`);
        }
        try {
            let file = declarationFile || typings || `${src.slice(0, -3)}.d.ts`;
            log.debug(`Attempting to open declaration file (.d.ts) at ${path.relative('.', file)}`);
            accessSync(file, R_OK);
            log.debug(`Declaration file (.d.ts) found`);
            return  {sourceRoot: path.dirname(file), sources: [path.basename(file)] }; 
        } catch(error) {
            if(declarationFile || error.code != 'ENOENT') {
                throw error;
            }
            log.info(`No declaration file (.d.ts) file found`);
        }
        return { sourceRoot: path.dirname(src), sources: [path.basename(src)] }; 
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

    static fromComment(type: Comment.Tag.Type, parent: Declaration, context: Context): Type {
        switch(type.type) {
            case 'NameExpression':
                switch(type.name) {
                    case 'boolean':
                        return new BooleanType(false, parent);
                    case 'number':
                        return new NumberType(false, parent);
                    case 'string':
                        return new StringType(false, parent);
                    case 'Error':
                        return new ErrorType(false, parent);
                    default:
                        return new DeclaredType(type, false, parent, context);
                }
        }
        return new AnyType(false, parent);
    }
        
    static from(type: ts.TypeNode, optional: boolean, parent: Declaration, context: Context): Type {
        try {
            switch(type.kind) {
                case ts.SyntaxKind.VoidKeyword:
                    return new VoidType(parent);
                case ts.SyntaxKind.AnyKeyword:
                    return new AnyType(optional, parent);
                case ts.SyntaxKind.BooleanKeyword:
                    return new BooleanType(optional, parent);
                case ts.SyntaxKind.NumberKeyword:
                    return new NumberType(optional, parent);
                case ts.SyntaxKind.StringKeyword:
                    return new StringType(optional, parent);
                case ts.SyntaxKind.ArrayType:
                    return new ArrayType([(type as ts.ArrayTypeNode).elementType], optional, parent, context);
                case ts.SyntaxKind.FunctionType:
                    return new FunctionType(type as ts.FunctionTypeNode, optional, parent, context);
                case ts.SyntaxKind.TypeReference:
                    return Type.fromReference(type as ts.TypeReferenceNode, optional, parent, context);
                case ts.SyntaxKind.UnionType:
                    return Type.fromUnion(type as ts.UnionTypeNode, parent, context);
                default:
                    throw `Unsupported type ${ts.SyntaxKind[type.kind]}`;                
            }
        } catch(error) {
            log.warn(`${error}, erasing to Any`, type);
            log.info(`This type is not supported by crossrails`, type)
            return new AnyType(optional, parent);
        }
    }
    
    static fromReference(reference: ts.TypeReferenceNode, optional: boolean, parent: Declaration, context: Context) {
        let identifier = reference.typeName as ts.Identifier
        switch(identifier.text) {
            case 'Error':
                return new ErrorType(optional, parent);
            case 'Array':
            case 'ReadonlyArray':
                return new ArrayType(reference.typeArguments, optional, parent, context);
            default:
                return new DeclaredType(reference, optional, parent, context);
        }
    }
        
    static fromUnion(union: ts.UnionTypeNode, parent: Declaration, context: Context) {
        if(union.types.length == 2) {
            if(union.types[0].kind == ts.SyntaxKind.NullKeyword || union.types[0].kind == ts.SyntaxKind.UndefinedKeyword) {
                return Type.from(union.types[1], true, parent, context);
            } else if(union.types[1].kind == ts.SyntaxKind.NullKeyword || union.types[1].kind == ts.SyntaxKind.UndefinedKeyword) {
                return Type.from(union.types[0], true, parent, context);                        
            }
        }
        throw `Unsupported type union, only unions between null or undefined and a single type supported`
    }  
}  

export class FunctionType extends Type {
    private _signature: FunctionSignature
    
    constructor(type: ts.FunctionTypeNode, optional: boolean, parent: Declaration, context: Context) {
        super(optional, parent);
        context.queue(() => {
            //todo support @callback tags
            this._signature = new FunctionSignature(type, new Comment(type), parent, context);
        });
    }  

    get signature() {
        return this._signature;
    }
}       

export abstract class GenericType extends Type {
    readonly typeArguments: ReadonlyArray<Type>
    
    constructor(typeArgs: ts.TypeNode[] | undefined, optional: boolean, parent: Declaration, context: Context) {
        super(optional, parent);
        let typeArguments: Type[] = [];
        if(typeArgs) for (let typeArg of typeArgs) {
            typeArguments.push(Type.from(typeArg, false, parent, context))
        }
        this.typeArguments = typeArguments;      
    }  
}       

export class DeclaredType extends GenericType {
    private _declaration?: TypeDeclaration;
    readonly name: string

    constructor(type: ts.TypeReferenceNode | Comment.Tag.Type, optional: boolean, parent: Declaration, context: Context) {
        if(DeclaredType.isTypeReferenceNode(type)) {
            super(type.typeArguments, optional, parent, context);
            this.name = (type.typeName as ts.Identifier).text;  
        } else {
            super([], optional, parent, context);
            this.name = type.name!;
        }    
        context.queue(() => {
            this._declaration = context.typeDeclarations.get(this.name);
            if(!this._declaration) {
                let msg = `Cannot find type ${this.name}`;
                if(DeclaredType.isTypeReferenceNode(type)) {
                    log.error(msg, type);
                } else {
                    log.error(msg, type.node, type.lineNumber);
                }
                log.info(`Resolve this error by adding the source for ${this.name} to the input file otherwise output will not compile standalone`)
            }
        })
    }     

    private static isTypeReferenceNode(type: ts.TypeReferenceNode | Comment.Tag.Type): type is ts.TypeReferenceNode {
        return (type as ts.TypeReferenceNode).typeName !== undefined;
    }

    get declaration(): TypeDeclaration|undefined {
        return this._declaration;
    }
}

export class VoidType extends Type {
    constructor(parent: Declaration) {
        super(false, parent);
    }
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
