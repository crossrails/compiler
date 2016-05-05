"use strict";
const fs_1 = require('fs');
const Path = require('path');
//import * as doctrine from 'doctrine';
const ts = require("typescript");
const log_1 = require("./log");
const types_1 = require("./types");
class Declaration {
    constructor(name, comment) {
        this.name = name;
        this.comment = comment;
    }
}
exports.Declaration = Declaration;
class VariableDeclaration extends Declaration {
    constructor(node) {
        super(node.name.text, undefined);
        this.type = types_1.Type.from(node.type, false);
        this.constant = (node.parent.flags & ts.NodeFlags.Const) != 0;
    }
}
exports.VariableDeclaration = VariableDeclaration;
class SourceFile extends Declaration {
    constructor(node) {
        super(Path.parse(node.fileName).name, undefined);
        let declarations = [];
        for (let statement of node.statements) {
            if (!(statement.flags & ts.NodeFlags.Export)) {
                log_1.default.info(`Skipping unexported ${ts.SyntaxKind[statement.kind]}`, statement);
            }
            else
                switch (statement.kind) {
                    case ts.SyntaxKind.VariableStatement:
                        for (let declaration of statement.declarationList.declarations) {
                            declarations.push(new VariableDeclaration(declaration));
                        }
                        break;
                    default:
                        log_1.default.warn(`Skipping ${ts.SyntaxKind[statement.kind]}`, statement);
                }
        }
        this.declarations = declarations;
        // console.log(JSON.stringify(ts.createSourceFile(node.fileName, readFileSync(node.fileName).toString(), ts.ScriptTarget.ES6, false), (key, value) => {
        //     return value ? Object.assign(value, { kind: ts.SyntaxKind[value.kind], flags: ts.NodeFlags[value.flags] }) : value;
        // }, 4));
    }
}
exports.SourceFile = SourceFile;
class Module extends Declaration {
    constructor(file) {
        let path = Path.parse(file);
        super(path.name, undefined);
        let files = [];
        try {
            log_1.default.debug(`Attempting to open sourcemap at ` + Path.relative('.', `${file}.map`));
            let map = JSON.parse(fs_1.readFileSync(`${file}.map`).toString());
            log_1.default.debug(`Sourcemap found with ${map.sources.length} source(s)`);
            for (let source of map.sources) {
                let filename = `${map.sourceRoot}${source}`;
                log_1.default.info(`Parsing ` + Path.relative('.', filename));
                files.push(new SourceFile(ts.createSourceFile(filename, fs_1.readFileSync(filename).toString(), ts.ScriptTarget.ES6, true)));
            }
        }
        catch (error) {
            log_1.default.debug(`No sourcemap found, parsing ` + Path.relative('.', file));
            files = [new SourceFile(ts.createSourceFile(file, fs_1.readFileSync(file).toString(), ts.ScriptTarget.ES6, true))];
        }
        this.files = files;
        this.src = path.base;
    }
}
exports.Module = Module;
//# sourceMappingURL=declarations.js.map