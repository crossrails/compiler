"use strict";
const fs_1 = require('fs');
const Path = require('path');
//import * as doctrine from 'doctrine';
const ts = require("typescript");
const log_1 = require("./log");
const ast_1 = require("./ast");
require("./types");
ast_1.VariableDeclaration.from = function (node) {
    return new ast_1.VariableDeclaration(node.name.text, undefined, ast_1.Type.from(node.type), (node.parent.flags & ts.NodeFlags.Const) != 0);
};
ast_1.SourceFile.from = function (node) {
    let declarations = [];
    for (let statement of node.statements) {
        if (!(statement.flags & ts.NodeFlags.Export)) {
            log_1.default.info(`Skipping unexported ${ts.SyntaxKind[statement.kind]}`, statement);
        }
        else
            switch (statement.kind) {
                case ts.SyntaxKind.VariableStatement:
                    for (let declaration of statement.declarationList.declarations) {
                        declarations.push(ast_1.VariableDeclaration.from(declaration));
                    }
                    break;
                default:
                    log_1.default.warn(`Skipping ${ts.SyntaxKind[statement.kind]}`, statement);
            }
    }
    return new ast_1.SourceFile(Path.parse(node.fileName).name, undefined, declarations);
    // console.log(JSON.stringify(ts.createSourceFile(node.fileName, readFileSync(node.fileName).toString(), ts.ScriptTarget.ES6, false), (key, value) => {
    //     return value ? Object.assign(value, { kind: ts.SyntaxKind[value.kind], flags: ts.NodeFlags[value.flags] }) : value;
    // }, 4));
};
ast_1.Module.from = function (file) {
    let files = [];
    try {
        log_1.default.debug(`Attempting to open sourcemap at ` + Path.relative('.', `${file}.map`));
        let map = JSON.parse(fs_1.readFileSync(`${file}.map`).toString());
        log_1.default.debug(`Sourcemap found with ${map.sources.length} source(s)`);
        for (let source of map.sources) {
            let filename = `${map.sourceRoot}${source}`;
            log_1.default.info(`Parsing ` + Path.relative('.', filename));
            files.push(ast_1.SourceFile.from(ts.createSourceFile(filename, fs_1.readFileSync(filename).toString(), ts.ScriptTarget.ES6, true)));
        }
    }
    catch (error) {
        log_1.default.debug(`No sourcemap found, parsing ` + Path.relative('.', file));
        files = [ast_1.SourceFile.from(ts.createSourceFile(file, fs_1.readFileSync(file).toString(), ts.ScriptTarget.ES6, true))];
    }
    let path = Path.parse(file);
    return new ast_1.Module(path.name, path.base, files);
};
//# sourceMappingURL=declarations.js.map