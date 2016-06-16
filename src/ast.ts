import {readFileSync} from 'fs';
import * as path from 'path';
//import * as doctrine from 'doctrine';
import * as ts from "typescript";
import {log} from "./log"

interface Context {
    readonly queue: Array<() => void>
    readonly declaredTypes: Map<string, TypeDeclaration>
    readonly identifiers: Set<string>;
}

export abstract class Declaration {       
    readonly name: string; 
    readonly parent: FunctionDeclaration|TypeDeclaration|SourceFile;

    constructor(node: ts.Declaration, parent: FunctionDeclaration|TypeDeclaration|SourceFile) {
        //make parent non-enumerable to avoid circular reference 
        Object.defineProperty(this, 'parent', { enumerable: false, writable: false, value: parent});
        this.name = (node.name as ts.Identifier).text;
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

    constructor(node: ts.Declaration, parent: TypeDeclaration|SourceFile, context: Context) {
        super(node, parent);
        this.protected = (node.flags & ts.NodeFlags.Protected) != 0;
        this.static = this.parent == this.sourceFile || (node.flags & ts.NodeFlags.Static) != 0;
        context.identifiers.add(this.name);
    }
}

export class FunctionDeclaration extends MemberDeclaration {
    readonly abstract: boolean;
    readonly typeParameters: ReadonlyArray<Type>
    readonly parameters: ReadonlyArray<ParameterDeclaration>
    readonly returnType: Type;

    constructor(node: ts.SignatureDeclaration, parent: TypeDeclaration|SourceFile, context: Context) {
        super(node, parent, context);
        if(node.type) {
            this.returnType = Type.from(node.type, false, this, context);
        } else {
            log.warn(`Return type information missing, resorting to Any`, node);
            this.returnType = new AnyType(false, this);
        } 
        let parameters: ParameterDeclaration[] = [];
        for(let parameter of node.parameters) {
            parameters.push(new ParameterDeclaration(parameter, this, context));
        }
        this.parameters = parameters;
        this.abstract = (node.flags & ts.NodeFlags.Abstract) != 0
    }

    get hasBody(): boolean {
        return !(this.abstract || this.parent instanceof InterfaceDeclaration);
    }
}

export class VariableDeclaration extends MemberDeclaration {
    readonly type: Type;
    readonly constant: boolean;
    
    constructor(node: ts.VariableDeclaration|ts.PropertyDeclaration, parent: TypeDeclaration|SourceFile, context: Context) {
        super(node, parent, context);
        if(node.type) {
            this.type = Type.from(node.type, false, this, context);
        } else {
            log.warn(`Type information missing, resorting to Any`, node);
            this.type = new AnyType(false, this);
        } 
        this.constant = (node.parent && node.parent.flags & ts.NodeFlags.Const) != 0
    }    
}

export class ParameterDeclaration extends Declaration {
    readonly type: Type;
    
    constructor(node: ts.ParameterDeclaration, parent: FunctionDeclaration, context: Context) {
        super(node, parent);
        if(node.type) {
            this.type = Type.from(node.type, false, this, context);
        } else {
            log.warn(`Type information missing, resorting to Any`, node);
            this.type = new AnyType(false, this);
        } 
    }    
}

export abstract class TypeDeclaration extends MemberDeclaration {
    readonly members: ReadonlyArray<MemberDeclaration>;
    
    constructor(node: ts.ClassDeclaration|ts.InterfaceDeclaration|ts.EnumDeclaration, parent: TypeDeclaration|SourceFile, context: Context) {
        super(node, parent, context);
        let members: MemberDeclaration[] = [];
        for (let member of node.members) {
            if(member.flags & ts.NodeFlags.Private) {
                log.debug(`Skipping private ${ts.SyntaxKind[member.kind]} ${(member.name as ts.Identifier || {text:"\b"}).text} of class ${this.name}`, member);                
            } else switch(member.kind) {
                case ts.SyntaxKind.PropertyDeclaration:
                    members.push(new VariableDeclaration(member as ts.PropertyDeclaration, this, context));
                    break;         
                case ts.SyntaxKind.MethodSignature:
                    members.push(new FunctionDeclaration(member as ts.MethodSignature, this, context));
                    break;                
                case ts.SyntaxKind.MethodDeclaration:
                    members.push(new FunctionDeclaration(member as ts.MethodDeclaration, this, context));
                    break;                
                default:
                    log.warn(`Skipping ${ts.SyntaxKind[member.kind]} ${(member.name as ts.Identifier || {text:"\b"}).text} of class ${this.name}`, member);
            }            
        }
        this.members = members;
        context.declaredTypes.set(this.name, this);
    }
}

export class InterfaceDeclaration extends TypeDeclaration {
    readonly typeParameters: ReadonlyArray<Type>
    
    constructor(node: ts.InterfaceDeclaration, parent: TypeDeclaration|SourceFile, context: Context) {
        super(node, parent, context);
    }
}

export class ClassDeclaration extends TypeDeclaration {
    readonly superClass: string|undefined;
    readonly typeParameters: ReadonlyArray<Type>
    
    constructor(node: ts.ClassDeclaration, parent: TypeDeclaration|SourceFile, context: Context) {
        super(node, parent, context);
    }
}

export class SourceFile {
    readonly path: path.ParsedPath;    
    readonly comment: string;  
    readonly declarations: ReadonlyArray<MemberDeclaration>
    readonly module: Module;
    
    constructor(node: ts.SourceFile, implicitExport: boolean, module: Module, context: Context) {
        // console.log(JSON.stringify(ts.createSourceFile(node.fileName, readFileSync(node.fileName).toString(), ts.ScriptTarget.ES6, false), (key, value) => {
        //     return value ? Object.assign(value, { kind: ts.SyntaxKind[value.kind], flags: ts.NodeFlags[value.flags] }) : value;
        // }, 4));
        this.path = path.parse(node.fileName);
        Object.defineProperty(this, 'module', { enumerable: false, writable: false, value: module});
        let declarations: MemberDeclaration[] = [];
        for (let statement of node.statements) {
            if(!(statement.flags & ts.NodeFlags.Export) && !implicitExport) {
                log.info(`Skipping unexported ${ts.SyntaxKind[statement.kind]}`, statement);                
            } else switch(statement.kind) {
                case ts.SyntaxKind.VariableStatement:
                    for (let declaration of (statement as ts.VariableStatement).declarationList.declarations) {
                        declarations.push(new VariableDeclaration(declaration, this, context));
                    }
                    break;   
                case ts.SyntaxKind.FunctionDeclaration:
                    declarations.push(new FunctionDeclaration(statement as ts.FunctionDeclaration, this, context));
                    break;                
                case ts.SyntaxKind.ClassDeclaration:
                    declarations.push(new ClassDeclaration(statement as ts.ClassDeclaration, this, context));
                    break;
                case ts.SyntaxKind.InterfaceDeclaration:
                    declarations.push(new InterfaceDeclaration(statement as ts.InterfaceDeclaration, this, context));
                    break;
                default:
                    log.warn(`Skipping ${ts.SyntaxKind[statement.kind]}`, statement);
            }            
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
    readonly identifiers: ReadonlyArray<string>;
    
    constructor(file: string, implicitExport: boolean, charset: string) {
        this.src = path.parse(file);
        this.name = this.src.name;
        let files: SourceFile[] = [];
        let context: Context = {queue: [], declaredTypes: new Map(), identifiers: new Set()};
        try {
            log.debug(`Attempting to open sourcemap at ${path.relative('.', `${file}.map`)}`);
            let map = JSON.parse(readFileSync(`${file}.map`, charset));
            log.debug(`Sourcemap found with ${map.sources.length} source(s)`);
            this.sourceRoot = map.sourceRoot;
            for (let source of map.sources) {
                this.addSourceFile(files, path.join(this.src.dir, map.sourceRoot, source), implicitExport, charset, context);
            }
        } catch(error) {
            if(error.code != 'ENOENT') {
                throw error;
            }
            log.debug(`No sourcemap found`);
            this.sourceRoot = '.';
            this.addSourceFile(files, file, implicitExport, charset, context);
        }
        if(files.length == 0) {
            log.warn(`Nothing to output as no exported declarations found in the source files`);                
        }
        context.queue.forEach(f => f());
        this.files = files;
        this.identifiers = Array.from(context.identifiers);
    }    


    private addSourceFile(files: SourceFile[], filename: string, implicitExport: boolean, charset: string, context: Context): void {
        log.info(`Parsing ${path.relative('.', filename)}`);
        let sourceFile = new SourceFile(ts.createSourceFile(filename, readFileSync(filename, charset), ts.ScriptTarget.ES6, true), implicitExport, this, context);
        if(sourceFile.declarations.length) {
            files.push(sourceFile);
        } else {
            log.info(`No exported declarations found in ${path.relative('.', filename)}`);            
        }
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
        
    static from(type: ts.TypeNode, optional: boolean, parent: Declaration, context: Context): Type {
        try {
            switch(type.kind) {
                case ts.SyntaxKind.VoidKeyword:
                    return new VoidType(optional, parent);
                case ts.SyntaxKind.AnyKeyword:
                    return new AnyType(optional, parent);
                case ts.SyntaxKind.BooleanKeyword:
                    return new BooleanType(optional, parent);
                case ts.SyntaxKind.NumberKeyword:
                    return new NumberType(optional, parent);
                case ts.SyntaxKind.StringKeyword:
                    return new StringType(optional,parent);
                case ts.SyntaxKind.ArrayType:
                    return new ArrayType([(type as ts.ArrayTypeNode).elementType], optional, parent, context);
                case ts.SyntaxKind.TypeReference:
                    return Type.fromReference(type as ts.TypeReferenceNode, optional, parent, context);
                case ts.SyntaxKind.UnionType:
                    return Type.fromUnion(type as ts.UnionTypeNode, parent, context);
                default:
                    throw `Unsupported type ${ts.SyntaxKind[type.kind]}`;                
            }
        } catch(error) {
            log.warn(`${error}, erasing to Any`, type);
            return new AnyType(optional, parent);
        }
    }
    
    static fromReference(reference: ts.TypeReferenceNode, optional: boolean, parent: Declaration, context: Context) {
        let identifier = reference.typeName as ts.Identifier
        switch(identifier.text) {
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
    private typeDeclaration?: TypeDeclaration;
    readonly name: string

    constructor(node: ts.TypeReferenceNode, optional: boolean, parent: Declaration, context: Context) {
        super(node.typeArguments, optional, parent, context);
        this.name = (node.typeName as ts.Identifier).text;  
        context.queue.push(() => {
            this.typeDeclaration = context.declaredTypes.get(this.name);
            if(!this.typeDeclaration) {
                log.error(`Cannot find type ${this.name}`, node);
            }
        })    
    }     

    get declaration(): TypeDeclaration|undefined {
        return this.typeDeclaration;
    }

    typeName(): string {
        return this.name;
    }
}

export class VoidType extends Type {
}

export class AnyType extends Type {
}

export class StringType extends Type  {
}

export class NumberType extends Type {
}

export class BooleanType extends Type {
}

export class ArrayType extends GenericType {
}
