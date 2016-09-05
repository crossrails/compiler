import * as fs from 'fs';
import * as rewire from 'rewire';
import * as ts from "typescript";
import * as assert from 'assert';
import {readFileSync} from 'fs';
import {log, Log} from "../../../src/log"

export function mockProgram(files: [string, string][]): ts.Program {
    const map = new Map(files);
    const services = ts.createLanguageService({
        getScriptFileNames: () => Array.from(map.keys()),
        getScriptVersion: (fileName) => '0',
        getScriptSnapshot: (fileName) => ts.ScriptSnapshot.fromString(map.get(fileName) || readFileSync(fileName, 'utf8')),
        getCurrentDirectory: () => '.',
        getCompilationSettings: () => { return {allowJS: true, skipLibCheck: true, skipDefaultLibCheck: true} },
        getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    }, ts.createDocumentRegistry())
    log.logDiagnostics(ts.getPreEmitDiagnostics(services.getProgram()));
    return services.getProgram();
}

export function mockVariables(source: string): [ts.VariableDeclaration[], ts.Program] {
    const program = mockProgram([['source.ts', source]]);
    return [(program.getSourceFiles().filter(f => !f.hasNoDefaultLib)[0].statements[0] as ts.VariableStatement).declarationList.declarations, program];
}
