import {readFileSync} from 'fs';
import * as Path from 'path';
//import * as doctrine from 'doctrine';
import * as ts from "typescript";

enum LogLevel {
    DEBUG,
    INFO,
    WARNING,
    ERROR
}

class Log {
    public level: LogLevel = LogLevel.DEBUG;

    public debug(message: string, node?: ts.Node) {
        this.log(LogLevel.DEBUG, message, node);
    }
    public info(message: string, node?: ts.Node) {
        this.log(LogLevel.INFO, message, node);
    }
    public warn(message: string, node?: ts.Node) {
        this.log(LogLevel.WARNING, message, node);
    }
    public error(message: string, node?: ts.Node) {
        this.log(LogLevel.ERROR, message, node);
    }
    public log(level: LogLevel, message: string, node?: ts.Node) {
        if(level >= this.level) {
            if(node) {
                let file = node.getSourceFile();
                let path = Path.relative('.', file.fileName);
                let pos = file.getLineAndCharacterOfPosition(node.pos);
                message = `${path}(${pos.line+1},${pos.character+1}): ${message}`;
            }
            message = `${LogLevel[level]}: ${message}`;
            console.log(message);    
        }
    }
}

let log = new Log();

interface Module {
    /*readonly*/ name: string
    /*readonly*/ src: string
    /*readonly*/ files: ReadonlyArray<SourceFile>
}

interface SourceFile {
    /*readonly*/ name: string
    /*readonly*/ declarations: ReadonlyArray<Declaration>
}

interface Declaration {
    /*readonly*/ name: string    
    /*readonly*/ comment: string    
}

interface VariableDeclaration extends Declaration {
    /*readonly*/ name: string    
    /*readonly*/ type: Type;
    /*readonly*/ const: boolean;
    ///*readonly*/ initializer?: Expression;
}

interface Type {
    /*readonly*/ optional: boolean;
}

interface AnyType extends Type {
    
}

interface StringType extends Type {
    
}

interface NumberType extends Type {
    
}

interface BooleanType extends Type {
    
}

interface GenericType extends Type {
    /*readonly*/ typeArguments: ReadonlyArray<Type>
}

interface ArrayType extends GenericType {
    
}

abstract class Type {
    constructor(optional?: boolean) {
        this.optional = optional;
    }      
    
    private static fromReference(reference: ts.TypeReferenceNode) {
        let identifier = reference.typeName as ts.Identifier
        switch(identifier.text) {
            case 'Array':
                return new ArrayType(reference);
            default:
                throw `Unsupported type reference ${identifier.text}`
        }
    }
      
    private static fromUnion(union: ts.UnionTypeNode) {
        if(union.types.length == 2) {
            if(union.types[0].kind == ts.SyntaxKind.NullKeyword || union.types[0].kind == ts.SyntaxKind.UndefinedKeyword) {
                return Type.from(union.types[1], true);
            } else if(union.types[1].kind == ts.SyntaxKind.NullKeyword || union.types[1].kind == ts.SyntaxKind.UndefinedKeyword) {
                return Type.from(union.types[0], true);                        
            }
        }
        throw `Unsupported type union, only unions between null or undefined and a single type supported`
    }
      
    static from(type: ts.TypeNode, optional?: boolean): Type {
        try {
            switch(type.kind) {
                case ts.SyntaxKind.AnyKeyword:
                    return new AnyType();
                case ts.SyntaxKind.BooleanKeyword:
                    return new BooleanType(optional);
                case ts.SyntaxKind.NumberKeyword:
                    return new NumberType(optional);
                case ts.SyntaxKind.StringKeyword:
                    return new StringType(optional);
                case ts.SyntaxKind.TypeReference:
                    return Type.fromReference(type as ts.TypeReferenceNode);
                case ts.SyntaxKind.UnionType:
                    return Type.fromUnion(type as ts.UnionTypeNode);
                default:
                    throw `Unsupported type ${ts.SyntaxKind[type.kind]}`;                
            }
        } catch(error) {
            log.warn(`${error}, erasing to Any`, type);
            return new AnyType();
        }
    }    
}

class AnyType extends Type {
    constructor(optional?: boolean) {
        super(optional);
    }      
}

class StringType extends Type {
    constructor(optional?: boolean) {
        super(optional);
    }      
}

class NumberType extends Type {
    constructor(optional?: boolean) {
        super(optional);
    }      
}

class BooleanType extends Type {
    constructor(optional?: boolean) {
        super(optional);
    }    
}

class GenericType extends Type {
    constructor(type: ts.TypeReferenceNode, optional?: boolean) {
       super(optional);
       let typeArguments: Type[] = [];
        for (let typeArgument of type.typeArguments) {
            typeArguments.push(Type.from(typeArgument))
        }
        this.typeArguments = typeArguments;        
    }       
}

class ArrayType extends GenericType {
    constructor(type: ts.TypeReferenceNode, optional?: boolean) {
        super(type, optional);
    }    
}

interface ClassDeclaration extends Declaration {
    /*readonly*/ superClass: string | undefined
    /*readonly*/ methods: ReadonlyArray<Method>
    
}

interface MethodDeclaration extends Declaration {
    /*readonly*/ abstract: boolean    
}

class VariableDeclaration {
    constructor(node: ts.VariableDeclaration) {
        this.name = (node.name as ts.Identifier).text;
        this.type = Type.from(node.type);
        this.const = (node.parent.flags & ts.NodeFlags.Const) != 0;
    }
}

class SourceFile {
    constructor(node: ts.SourceFile) {
        this.name = Path.parse(node.fileName).name;        
        let declarations: Declaration[] = [];
        for (let statement of node.statements) {
            if(!(statement.flags & ts.NodeFlags.Export)) {
                log.info(`Skipping unexported ${ts.SyntaxKind[statement.kind]}`, statement);                
            } else switch(statement.kind) {
                case ts.SyntaxKind.VariableStatement:
                    for (let declaration of (statement as ts.VariableStatement).declarationList.declarations) {
                        declarations.push(new VariableDeclaration(declaration));
                    }
                    break;         
                default:
                    log.warn(`Skipping ${ts.SyntaxKind[statement.kind]}`, statement);
            }            
        }
        this.declarations = declarations;
        // console.log(JSON.stringify(ts.createSourceFile(node.fileName, readFileSync(node.fileName).toString(), ts.ScriptTarget.ES6, false), (key, value) => {
        //     return value ? Object.assign(value, { kind: ts.SyntaxKind[value.kind], flags: ts.NodeFlags[value.flags] }) : value;
        // }, 4));
    }
}

class Module {    
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
                files.push(new SourceFile(ts.createSourceFile(filename, readFileSync(filename).toString(), ts.ScriptTarget.ES6, true)));
            }
        } catch(error) {
            log.debug(`No sourcemap found, parsing ` + Path.relative('.', file));
            files = [new SourceFile(ts.createSourceFile(file, readFileSync(file).toString(), ts.ScriptTarget.ES6, true))];                    
        }
        this.files = files;
    }
}

let filename: string|undefined = process.argv[2];
if(filename == undefined) {
    log.debug('No filename supplied attempting to open package.json in current directory')
} else {
    let module = new Module(filename);
    console.log(JSON.stringify(module, (key, value) => {
        return value ? Object.assign(value, { kind: value.constructor.name }) : value;
    }, 4))
}
