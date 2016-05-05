import {readFileSync} from 'fs';
import * as Path from 'path';
//import * as doctrine from 'doctrine';
import * as ts from "typescript";
import log from "./log" 
import * as ast from "./ast/ast";
import {Type} from "./types"

export class Declaration implements ast.Declaration {
    constructor(public readonly name: string, public readonly comment: string) {}
}

export class VariableDeclaration extends Declaration implements ast.VariableDeclaration {
    readonly type: Type;
    readonly constant: boolean;

    constructor(node: ts.VariableDeclaration) {
        super((node.name as ts.Identifier).text, undefined);
        this.type = Type.from(node.type, false); 
        this.constant = (node.parent.flags & ts.NodeFlags.Const) != 0
    }
}

export class SourceFile extends Declaration implements ast.SourceFile {
    readonly declarations: ReadonlyArray<Declaration>

    constructor(node: ts.SourceFile) {
        super(Path.parse(node.fileName).name, undefined);
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

export class Module extends Declaration implements ast.Module {
    readonly src: string;
    readonly files: ReadonlyArray<SourceFile>;
    
    constructor(file: string) {
        let path = Path.parse(file);
        super(path.name, undefined);
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
        this.src = path.base;
    }
}
