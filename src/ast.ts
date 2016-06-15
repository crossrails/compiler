import {readFileSync} from 'fs';
import * as path from 'path';
//import * as doctrine from 'doctrine';
import * as ts from "typescript";
import {log} from "./log"

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

    constructor(node: ts.Declaration, parent: TypeDeclaration|SourceFile) {
        super(node, parent);
        this.protected = (node.flags & ts.NodeFlags.Protected) != 0;
        this.static = this.parent == this.sourceFile || (node.flags & ts.NodeFlags.Static) != 0;
        this.module.identifiers.add(this.name);
    }
}

export class FunctionDeclaration extends MemberDeclaration {
    readonly abstract: boolean;
    readonly typeParameters: ReadonlyArray<Type>
    readonly parameters: ReadonlyArray<ParameterDeclaration>
    readonly returnType: Type;

    constructor(node: ts.SignatureDeclaration, parent: TypeDeclaration|SourceFile) {
        super(node, parent);
        if(node.type) {
            this.returnType = Type.from(node.type, false);
        } else {
            log.warn(`Return type information missing, resorting to Any`, node);
            this.returnType = new AnyType(false);
        } 
        let parameters: ParameterDeclaration[] = [];
        for(let parameter of node.parameters) {
            parameters.push(new ParameterDeclaration(parameter, this));
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
    
    constructor(node: ts.VariableDeclaration|ts.PropertyDeclaration, parent: TypeDeclaration|SourceFile) {
        super(node, parent);
        if(node.type) {
            this.type = Type.from(node.type, false);
        } else {
            log.warn(`Type information missing, resorting to Any`, node);
            this.type = new AnyType(false);
        } 
        this.constant = (node.parent && node.parent.flags & ts.NodeFlags.Const) != 0
    }    
}

export class ParameterDeclaration extends Declaration {
    readonly type: Type;
    
    constructor(node: ts.ParameterDeclaration, parent: FunctionDeclaration) {
        super(node, parent);
        if(node.type) {
            this.type = Type.from(node.type, false);
        } else {
            log.warn(`Type information missing, resorting to Any`, node);
            this.type = new AnyType(false);
        } 
    }    
}

export abstract class TypeDeclaration extends MemberDeclaration {
    readonly members: ReadonlyArray<MemberDeclaration>;
    
    constructor(node: ts.ClassDeclaration|ts.InterfaceDeclaration|ts.EnumDeclaration, parent: TypeDeclaration|SourceFile) {
        super(node, parent);
        let members: MemberDeclaration[] = [];
        for (let member of node.members) {
            if(member.flags & ts.NodeFlags.Private) {
                log.debug(`Skipping private ${ts.SyntaxKind[member.kind]} ${(member.name as ts.Identifier || {text:"\b"}).text} of class ${this.name}`, member);                
            } else switch(member.kind) {
                case ts.SyntaxKind.PropertyDeclaration:
                    members.push(new VariableDeclaration(member as ts.PropertyDeclaration, this));
                    break;         
                case ts.SyntaxKind.MethodSignature:
                    members.push(new FunctionDeclaration(member as ts.MethodSignature, this));
                    break;                
                case ts.SyntaxKind.MethodDeclaration:
                    members.push(new FunctionDeclaration(member as ts.MethodDeclaration, this));
                    break;                
                default:
                    log.warn(`Skipping ${ts.SyntaxKind[member.kind]} ${(member.name as ts.Identifier || {text:"\b"}).text} of class ${this.name}`, member);
            }            
        }
        this.members = members;
    }
}

export class InterfaceDeclaration extends TypeDeclaration {
    readonly typeParameters: ReadonlyArray<Type>
    
    constructor(node: ts.InterfaceDeclaration, parent: TypeDeclaration|SourceFile) {
        super(node, parent);
    }
}

export class ClassDeclaration extends TypeDeclaration {
    readonly superClass: string|undefined;
    readonly typeParameters: ReadonlyArray<Type>
    
    constructor(node: ts.ClassDeclaration, parent: TypeDeclaration|SourceFile) {
        super(node, parent);
    }
}

export class SourceFile {
    readonly path: path.ParsedPath;    
    readonly comment: string;  
    readonly declarations: ReadonlyArray<MemberDeclaration>
    readonly module: Module;
    
    constructor(node: ts.SourceFile, implicitExport: boolean, module: Module) {
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
                        declarations.push(new VariableDeclaration(declaration, this));
                    }
                    break;   
                case ts.SyntaxKind.FunctionDeclaration:
                    declarations.push(new FunctionDeclaration(statement as ts.FunctionDeclaration, this));
                    break;                
                case ts.SyntaxKind.ClassDeclaration:
                    declarations.push(new ClassDeclaration(statement as ts.ClassDeclaration, this));
                    break;
                case ts.SyntaxKind.InterfaceDeclaration:
                    declarations.push(new InterfaceDeclaration(statement as ts.InterfaceDeclaration, this));
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
    readonly identifiers: Set<string>;
    
    constructor(file: string, implicitExport: boolean, charset: string) {
        this.src = path.parse(file);
        this.name = this.src.name;
        this.identifiers = new Set();
        let files: SourceFile[] = [];
        try {
            log.debug(`Attempting to open sourcemap at ${path.relative('.', `${file}.map`)}`);
            let map = JSON.parse(readFileSync(`${file}.map`, charset));
            log.debug(`Sourcemap found with ${map.sources.length} source(s)`);
            this.sourceRoot = map.sourceRoot;
            for (let source of map.sources) {
                this.addSourceFile(files, path.join(this.src.dir, map.sourceRoot, source), implicitExport, charset);
            }
        } catch(error) {
            if(error.code != 'ENOENT') {
                throw error;
            }
            log.debug(`No sourcemap found`);
            this.sourceRoot = '.';
            this.addSourceFile(files, file, implicitExport, charset);
        }
        if(files.length == 0) {
            log.warn(`Nothing to output as no exported declarations found in the source files`);                
        }
        this.files = files;
    }    

    private addSourceFile(files: SourceFile[], filename: string, implicitExport: boolean, charset: string): void {
        log.info(`Parsing ${path.relative('.', filename)}`);
        let sourceFile = new SourceFile(ts.createSourceFile(filename, readFileSync(filename, charset), ts.ScriptTarget.ES6, true), implicitExport, this);
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
    
    constructor(optional: boolean) {
        this.optional = optional;
    }
        
    static from(type: ts.TypeNode, optional: boolean): Type {
        try {
            switch(type.kind) {
                case ts.SyntaxKind.VoidKeyword:
                    return VoidType.Instance;
                case ts.SyntaxKind.AnyKeyword:
                    return new AnyType(optional);
                case ts.SyntaxKind.BooleanKeyword:
                    return new BooleanType(optional);
                case ts.SyntaxKind.NumberKeyword:
                    return new NumberType(optional);
                case ts.SyntaxKind.StringKeyword:
                    return new StringType(optional);
                case ts.SyntaxKind.ArrayType:
                    return new ArrayType([(type as ts.ArrayTypeNode).elementType], optional);
                case ts.SyntaxKind.TypeReference:
                    return Type.fromReference(type as ts.TypeReferenceNode, optional);
                case ts.SyntaxKind.UnionType:
                    return Type.fromUnion(type as ts.UnionTypeNode);
                default:
                    throw `Unsupported type ${ts.SyntaxKind[type.kind]}`;                
            }
        } catch(error) {
            log.warn(`${error}, erasing to Any`, type);
            return new AnyType(optional);
        }
    }
    
    static fromReference(reference: ts.TypeReferenceNode, optional: boolean) {
        let identifier = reference.typeName as ts.Identifier
        switch(identifier.text) {
            case 'Array':
            case 'ReadonlyArray':
                return new ArrayType(reference.typeArguments, optional);
            default:
                throw `Unsupported type reference ${identifier.text}`
        }
    }
        
    static fromUnion(union: ts.UnionTypeNode) {
        if(union.types.length == 2) {
            if(union.types[0].kind == ts.SyntaxKind.NullKeyword || union.types[0].kind == ts.SyntaxKind.UndefinedKeyword) {
                return Type.from(union.types[1], true);
            } else if(union.types[1].kind == ts.SyntaxKind.NullKeyword || union.types[1].kind == ts.SyntaxKind.UndefinedKeyword) {
                return Type.from(union.types[0], true);                        
            }
        }
        throw `Unsupported type union, only unions between null or undefined and a single type supported`
    }  
}  

export abstract class GenericType extends Type {
    readonly typeArguments: ReadonlyArray<Type>
    
    constructor(typeArgs: ts.TypeNode[] | undefined, optional: boolean) {
        super(optional);
        let typeArguments: Type[] = [];
        if(typeArgs) for (let typeArg of typeArgs) {
            typeArguments.push(Type.from(typeArg, false))
        }
        this.typeArguments = typeArguments;      
    }  
}       

export class VoidType extends Type {
    static Instance = new VoidType()

    private constructor() {
        super(false);
    }
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
