
import {readFileSync} from 'fs';
import * as Path from 'path';
//import * as doctrine from 'doctrine';
import * as ts from "typescript";
import log from "./log" 
import {Module, SourceFile, Declaration, VariableDeclaration, Type} from "./ast";
import "./types"

declare module "./ast" {
    namespace Module {
        function from(file: string): Module
    }
    namespace SourceFile {
        function from(node: ts.SourceFile): SourceFile
    }
    namespace VariableDeclaration {
        function from(node: ts.VariableDeclaration): VariableDeclaration
    }
}

VariableDeclaration.from = function(node: ts.VariableDeclaration): VariableDeclaration {
    return new VariableDeclaration(
        (node.name as ts.Identifier).text, 
        undefined, 
        Type.from(node.type), 
        (node.parent.flags & ts.NodeFlags.Const) != 0
    );
}

SourceFile.from = function(node: ts.SourceFile): SourceFile {
    let declarations: Declaration[] = [];
    for (let statement of node.statements) {
        if(!(statement.flags & ts.NodeFlags.Export)) {
            log.info(`Skipping unexported ${ts.SyntaxKind[statement.kind]}`, statement);                
        } else switch(statement.kind) {
            case ts.SyntaxKind.VariableStatement:
                for (let declaration of (statement as ts.VariableStatement).declarationList.declarations) {
                    declarations.push(VariableDeclaration.from(declaration));
                }
                break;         
            default:
                log.warn(`Skipping ${ts.SyntaxKind[statement.kind]}`, statement);
        }            
    }
    return new SourceFile(Path.parse(node.fileName).name, undefined, declarations);
    // console.log(JSON.stringify(ts.createSourceFile(node.fileName, readFileSync(node.fileName).toString(), ts.ScriptTarget.ES6, false), (key, value) => {
    //     return value ? Object.assign(value, { kind: ts.SyntaxKind[value.kind], flags: ts.NodeFlags[value.flags] }) : value;
    // }, 4));
}

Module.from = function(file: string): Module {
    let files: SourceFile[] = [];
    try {
        log.debug(`Attempting to open sourcemap at ` + Path.relative('.', `${file}.map`));
        let map = JSON.parse(readFileSync(`${file}.map`).toString());
        log.debug(`Sourcemap found with ${map.sources.length} source(s)`);
        for (let source of map.sources) {
            let filename = `${map.sourceRoot}${source}`;
            log.info(`Parsing ` + Path.relative('.', filename));
            files.push(SourceFile.from(ts.createSourceFile(filename, readFileSync(filename).toString(), ts.ScriptTarget.ES6, true)));
        }
    } catch(error) {
        log.debug(`No sourcemap found, parsing ` + Path.relative('.', file));
        files = [SourceFile.from(ts.createSourceFile(file, readFileSync(file).toString(), ts.ScriptTarget.ES6, true))];                    
    }
    let path = Path.parse(file);
    return new Module(path.name, path.base, files);
}

