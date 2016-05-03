"use strict";
const fs_1 = require('fs');
const Path = require('path');
const winston = require('winston');
//import * as doctrine from 'doctrine';
const ts = require("typescript");
var console = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            level: 'debug',
            formatter: function (options) {
                let message = options.level.toUpperCase() + ': ' + (undefined !== options.message ? options.message : '');
                let node = options.meta;
                if (node) {
                    let file = node.getSourceFile();
                    let pos = file.getLineAndCharacterOfPosition(node.pos);
                    message = `${file.fileName}(${pos.line},${pos.character}): ${message}`;
                }
                return message;
            }
        })
    ]
});
class Type {
    static of(type) {
        switch (type.kind) {
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
class VariableDeclaration {
    constructor(node) {
        this.name = node.name.text;
        this.type = Type.of(node.type);
        this.const = (node.parent.flags & ts.NodeFlags.Const) != 0;
    }
}
class SourceFile {
    constructor(node) {
        this.name = Path.parse(node.fileName).name;
        let declarations = [];
        for (let statement of node.statements) {
            if (!(statement.flags & ts.NodeFlags.Export)) {
                console.info(`Skipping unexported ${ts.SyntaxKind[statement.kind]}`, statement);
            }
            else
                switch (statement.kind) {
                    case ts.SyntaxKind.VariableStatement:
                        for (let declaration of statement.declarationList.declarations) {
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
    constructor(file) {
        let path = Path.parse(file);
        this.src = path.base;
        this.name = path.name;
        let files = [];
        try {
            console.debug(`Attempting to open sourcemap at ${file}.map`);
            let map = JSON.parse(fs_1.readFileSync(`${file}.map`).toString());
            console.debug(`Sourcemap found with ${map.sources.length} source(s)`);
            for (let source of map.sources) {
                let filename = `${map.sourceRoot}${source}`;
                console.info(`Parsing ${filename}`);
                files.push(new SourceFile(ts.createSourceFile(filename, fs_1.readFileSync(filename).toString(), ts.ScriptTarget.ES6, true)));
            }
        }
        catch (error) {
            files = [new SourceFile(ts.createSourceFile(file, fs_1.readFileSync(file).toString(), ts.ScriptTarget.ES6, true))];
        }
        this.files = files;
    }
}
let filename = process.argv[2];
if (filename == undefined) {
    console.debug('No filename supplied attempting to open package.json in current directory');
}
else {
    let module = new Module(filename);
}
console.error('boom', null);
//# sourceMappingURL=main.js.map