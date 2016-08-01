import * as fs from 'fs';
import * as rewire from 'rewire';
import * as ts from "typescript";
import {readFileSync} from 'fs';
import {SourceFile, Context} from "../../src/ast"

export function mockProgram(files: [string, string][], noLib: boolean = false) {
    const map = new Map(files);
    const services = ts.createLanguageService({
        getScriptFileNames: () => Array.from(map.keys()),
        getScriptVersion: (fileName) => '0',
        getScriptSnapshot: (fileName) => ts.ScriptSnapshot.fromString(map.get(fileName) || readFileSync(fileName, 'utf8')),
        getCurrentDirectory: () => process.cwd(),
        getCompilationSettings: () => { return {allowJS: true, noLib: noLib} },
        getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    }, ts.createDocumentRegistry())
    return services.getProgram();
}

export function mockSourceFile(implicitExport: boolean, source: string): SourceFile {
    const program = mockProgram([['source.ts', source]], true);
    let context = new Context(program);
    const file = new SourceFile(program.getSourceFile('source.ts'), implicitExport, {} as any, context);
    context.finalize();
    return file;
}
