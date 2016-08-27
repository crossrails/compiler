import * as fs from 'fs';
import * as rewire from 'rewire';
import * as ts from "typescript";
import * as assert from 'assert';
import {readFileSync} from 'fs';
import {SourceFile, Context} from "../../src/ast"
import {log, Log} from "../../src/log"

export function mockProgram(files: [string, string][]) {
    const map = new Map(files);
    const services = ts.createLanguageService({
        getScriptFileNames: () => Array.from(map.keys()),
        getScriptVersion: (fileName) => '0',
        getScriptSnapshot: (fileName) => ts.ScriptSnapshot.fromString(map.get(fileName) || readFileSync(fileName, 'utf8')),
        getCurrentDirectory: () => '.',
        getCompilationSettings: () => { return {allowJS: true} },
        getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    }, ts.createDocumentRegistry())
    log.logDiagnostics(ts.getPreEmitDiagnostics(services.getProgram()));
    return services.getProgram();
}

export function mockSourceFile(implicitExport: boolean, source: string): SourceFile {
    const program = mockProgram([['source.ts', source]]);
    let context = new Context(program);
    const file = new SourceFile(program.getSourceFile('source.ts'), implicitExport, {} as any, context);
    context.finalize();
    return file;
}
