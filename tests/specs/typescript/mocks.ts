import * as ts from "typescript";
import {readFileSync} from 'fs';
import {log} from "../../../src/log"

export function mockProgram(files: [string, string][]): ts.Program {
    const map = new Map(files);
    const services = ts.createLanguageService({
        getScriptFileNames: () => Array.from(map.keys()),
        getScriptKind: (fileName) => fileName.endsWith('.js') ? ts.ScriptKind.JS : ts.ScriptKind.TS,
        getScriptVersion: (fileName) => '0',
        getScriptSnapshot: (fileName) => ts.ScriptSnapshot.fromString(map.get(fileName) || readFileSync(fileName, 'utf8')),
        getCurrentDirectory: () => '.',
        getCompilationSettings: () => { return {allowJS: true, skipLibCheck: true, skipDefaultLibCheck: true} },
        getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    }, ts.createDocumentRegistry())
    log.logDiagnostics(ts.getPreEmitDiagnostics(services.getProgram()));
    // for(let [name, source] of map) {
    //     console.log(JSON.stringify(ts.createSourceFile(name, source, ts.ScriptTarget.ES6, false), (key, value) => { 
    //         return value ? Object.assign(value, { kind: ts.SyntaxKind[value.kind], flags: ts.NodeFlags[value.flags] }) : value; 
    //     }, 4));         
    // }
    return services.getProgram();
}

export function mockVariables(source: string): [ts.VariableDeclaration[], ts.Program] {
    const program = mockProgram([['source.ts', source]]);
    return [(program.getSourceFiles().filter(f => !f.hasNoDefaultLib)[0].statements[0] as ts.VariableStatement).declarationList.declarations, program];
}
