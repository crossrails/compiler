import {readFileSync} from 'fs';
import * as Path from 'path';
//import * as doctrine from 'doctrine';
import * as ts from "typescript";
import log from "./log"

export abstract class Declaration {    
    readonly name: string; 
    readonly comment: string
    readonly parent: Declaration|SourceFile;
    
    constructor(node: ts.Declaration, parent: Declaration|SourceFile) {
        this.parent = parent; 
        this.name = (node.name as ts.Identifier).text;
    }
    
    get module(): Module {
        return this.parent.module;
    }
    
    get sourceFile(): SourceFile {
        return this.parent.sourceFile;
    }
        
    abstract accept(visitor: DeclarationVisitor): void;   
}

export interface DeclarationVisitor {
    visitVariable(node: VariableDeclaration): void;
    visitClass(node: ClassDeclaration): void;
    visitMethod(node: MethodDeclaration): void;
}

export class VariableDeclaration extends Declaration {
    readonly type: Type;
    readonly constant: boolean;
    
    constructor(node: ts.VariableDeclaration, parent: Declaration|SourceFile) {
        super(node, parent);
        if(node.type) {
            this.type = Type.from(node.type, false);
        } else {
            log.warn(`Type information missing, resorting to Any`, node);
            this.type = new AnyType(false);
        } 
        this.constant = (node.parent && node.parent.flags & ts.NodeFlags.Const) != 0
    }
    
    accept<T>(visitor: DeclarationVisitor) {
        visitor.visitVariable(this);
    }
}

export class ClassDeclaration extends Declaration {
    readonly superClass: string | undefined;
    readonly methods: ReadonlyArray<MethodDeclaration>;
    
    accept<T>(visitor: DeclarationVisitor) {
        visitor.visitClass(this);
    }
}

export class MethodDeclaration extends Declaration {
    readonly abstract: boolean;
    
    accept<T>(visitor: DeclarationVisitor) {
        visitor.visitMethod(this);
    }
}

export class SourceFile {
    readonly filename: string;    
    readonly comment: string;  
    readonly declarations: ReadonlyArray<Declaration>
    readonly module: Module;
    
    constructor(node: ts.SourceFile, module: Module) {
        // console.log(JSON.stringify(ts.createSourceFile(node.fileName, readFileSync(node.fileName).toString(), ts.ScriptTarget.ES6, false), (key, value) => {
        //     return value ? Object.assign(value, { kind: ts.SyntaxKind[value.kind], flags: ts.NodeFlags[value.flags] }) : value;
        // }, 4));
        this.filename = Path.parse(node.fileName).name;
        this.module = module
        let declarations: Declaration[] = [];
        for (let statement of node.statements) {
            if(!(statement.flags & ts.NodeFlags.Export)) {
                log.info(`Skipping unexported ${ts.SyntaxKind[statement.kind]}`, statement);                
            } else switch(statement.kind) {
                case ts.SyntaxKind.VariableStatement:
                    for (let declaration of (statement as ts.VariableStatement).declarationList.declarations) {
                        declarations.push(new VariableDeclaration(declaration, this));
                    }
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
    readonly src: string;
    readonly files: ReadonlyArray<SourceFile>;
    
    constructor(file: string) {
        let path = Path.parse(file);
        this.src = path.base;
        this.name = path.name;
        let files: SourceFile[] = [];
        try {
            log.debug(`Attempting to open sourcemap at ` + Path.relative('.', `${file}.map`));
            let map = JSON.parse(readFileSync(`${file}.map`).toString());
            log.debug(`Sourcemap found with ${map.sources.length} source(s)`);
            for (let source of map.sources) {
                let filename = `${map.sourceRoot}${source}`;
                log.info(`Parsing ` + Path.relative('.', filename));
                files.push(new SourceFile(ts.createSourceFile(filename, readFileSync(filename).toString(), ts.ScriptTarget.ES6, true), this));
            }
        } catch(error) {
            log.debug(`No sourcemap found, parsing ` + Path.relative('.', file));
            files = [new SourceFile(ts.createSourceFile(file, readFileSync(file).toString(), ts.ScriptTarget.ES6, true), this)];                    
        }
        this.files = files;
    }    
}

export abstract class Type {
    readonly optional: boolean
    
    constructor(optional: boolean) {
        this.optional = optional;
    }
    
    abstract accept<R>(visitor: TypeVisitor<R>): R;
    
    static from(type: ts.TypeNode, optional: boolean): Type {
        try {
            switch(type.kind) {
                case ts.SyntaxKind.AnyKeyword:
                    return new AnyType(optional);
                case ts.SyntaxKind.BooleanKeyword:
                    return new BooleanType(optional);
                case ts.SyntaxKind.NumberKeyword:
                    return new NumberType(optional);
                case ts.SyntaxKind.StringKeyword:
                    return new StringType(optional);
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
                return new ArrayType(reference, optional);
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

export interface TypeVisitor<R> {
    visitAnyType(node: AnyType): R;
    visitStringType(node: StringType): R;
    visitNumberType(node: NumberType): R;
    visitBooleanType(node: BooleanType): R;
    visitArrayType(node: ArrayType): R;
}

export abstract class GenericType extends Type {
    readonly typeArguments: ReadonlyArray<Type>
    
    constructor(type: ts.TypeReferenceNode, optional: boolean) {
        super(optional);
        let typeArguments: Type[] = [];
        if(type.typeArguments) for (let typeArgument of type.typeArguments) {
            typeArguments.push(Type.from(typeArgument, false))
        }
        this.typeArguments = typeArguments;      
    }  
}       

export class AnyType extends Type {
    accept<R>(visitor: TypeVisitor<R>): R {
        return visitor.visitAnyType(this);
    }
}

export class StringType extends Type  {
    accept<R>(visitor: TypeVisitor<R>): R {
        return visitor.visitStringType(this);
    }    
}

export class NumberType extends Type {
    accept<R>(visitor: TypeVisitor<R>): R {
        return visitor.visitNumberType(this);
    }    
}

export class BooleanType extends Type {
    accept<R>(visitor: TypeVisitor<R>): R {
        return visitor.visitBooleanType(this);
    }    
}

export class ArrayType extends GenericType {
    accept<R>(visitor: TypeVisitor<R>): R {
        return visitor.visitArrayType(this);
    }    
}
