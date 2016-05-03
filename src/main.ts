import {readFileSync} from 'fs';
import * as Path from 'path';
import * as winston from 'winston';
//import * as doctrine from 'doctrine';
import * as ts from "typescript";

var console: winston.LoggerInstance = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level: 'debug',
      formatter: function(options: any) {
        let message = options.level.toUpperCase() + ': '+ (undefined !== options.message ? options.message : '');
        let node: ts.Node = options.meta;
        if(node) {
            let file = node.getSourceFile();
            let pos = file.getLineAndCharacterOfPosition(node.pos);
            message = `${file.fileName}(${pos.line},${pos.character}): ${message}`;
        }
        return message;
      }
    })
  ]
});

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

class Type {
    static of(type: ts.TypeNode): Type {
        switch(type.kind) {
            default:
                console.warn(`Unknown type ${ts.SyntaxKind[type.kind]}, erasing to Any`, type);
            case ts.SyntaxKind.AnyKeyword:
                return new AnyType();
            case ts.SyntaxKind.BooleanKeyword:
                return new BooleanType();
            case ts.SyntaxKind.NumberKeyword:
                return new NumberType();
            case ts.SyntaxKind.StringKeyword:
                return new StringType();
        }
    }    
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
    
}

interface ArrayType extends GenericType {
    
}

class AnyType extends Type {
    
}

class StringType extends Type {
    
}

class NumberType extends Type {
    
}

class BooleanType extends Type {
    
}

class GenericType extends Type {
    
}

class ArrayType extends GenericType {
    
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
        this.type = Type.of(node.type);
        this.const = (node.parent.flags & ts.NodeFlags.Const) != 0;
    }
}

class SourceFile {
    constructor(node: ts.SourceFile) {
        this.name = Path.parse(node.fileName).name;        
        let declarations: Declaration[] = [];
        for (let statement of node.statements) {
            if(!(statement.flags & ts.NodeFlags.Export)) {
                console.info(`Skipping unexported ${ts.SyntaxKind[statement.kind]}`, statement);                
            } else switch(statement.kind) {
                case ts.SyntaxKind.VariableStatement:
                    for (let declaration of (statement as ts.VariableStatement).declarationList.declarations) {
                        declarations.push(new VariableDeclaration(declaration));
                    }
                    break;               
                default:
                    console.warn(`Skipping ${ts.SyntaxKind[statement.kind]}`, statement);
            }            
        }
        this.declarations = declarations;
    }
}

class Module {    
    constructor(file: string) {
        let path = Path.parse(file);
        this.src = path.base;
        this.name = path.name;
        let files: SourceFile[] = [];
        try {
            console.debug(`Attempting to open sourcemap at ${file}.map`);
            let map = JSON.parse(readFileSync(`${file}.map`).toString());
            console.debug(`Sourcemap found with ${map.sources.length} source(s)`);
            for (let source of map.sources) {
                let filename = `${map.sourceRoot}${source}`;
                console.info(`Parsing ${filename}`);
                files.push(new SourceFile(ts.createSourceFile(filename, readFileSync(filename).toString(), ts.ScriptTarget.ES6, true)));
                // console.debug(JSON.stringify(ts.createSourceFile(filename, readFileSync(filename).toString(), ts.ScriptTarget.ES6, false), (key, value) => {
                //     return value ? Object.assign(value, { kind: ts.SyntaxKind[value.kind], flags: ts.NodeFlags[value.flags] }) : value;
                // }, 4))
            }
        } catch(error) {
            files = [new SourceFile(ts.createSourceFile(file, readFileSync(file).toString(), ts.ScriptTarget.ES6, true))];                    
        }
        this.files = files;
    }
}

let filename: string|undefined = process.argv[2];
if(filename == undefined) {
    console.debug('No filename supplied attempting to open package.json in current directory')
} else {
    let module = new Module(filename);
    // console.debug(JSON.stringify(module, (key, value) => {
    //     return Object.assign(value, { kind: value.constructor.name });
    // }, 4))
}

console.error('boom', null)
