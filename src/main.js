"use strict";
const fs_1 = require('fs');
const Path = require('path');
//import * as doctrine from 'doctrine';
const ts = require("typescript");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARNING"] = 2] = "WARNING";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
class Log {
    constructor() {
        this.level = LogLevel.DEBUG;
    }
    debug(message, node) {
        this.log(LogLevel.DEBUG, message, node);
    }
    info(message, node) {
        this.log(LogLevel.INFO, message, node);
    }
    warn(message, node) {
        this.log(LogLevel.WARNING, message, node);
    }
    error(message, node) {
        this.log(LogLevel.ERROR, message, node);
    }
    log(level, message, node) {
        if (level >= this.level) {
            if (node) {
                let file = node.getSourceFile();
                let path = Path.relative('.', file.fileName);
                let pos = file.getLineAndCharacterOfPosition(node.pos);
                message = `${path}(${pos.line + 1},${pos.character + 1}): ${message}`;
            }
            message = `${LogLevel[level]}: ${message}`;
            console.log(message);
        }
    }
}
let log = new Log();
class Type {
    constructor(optional) {
        this.optional = optional;
    }
    static fromReference(reference) {
        let identifier = reference.typeName;
        switch (identifier.text) {
            case 'Array':
                return new ArrayType(reference);
            default:
                throw `Unsupported type reference ${identifier.text}`;
        }
    }
    static fromUnion(union) {
        if (union.types.length == 2) {
            if (union.types[0].kind == ts.SyntaxKind.NullKeyword || union.types[0].kind == ts.SyntaxKind.UndefinedKeyword) {
                return Type.from(union.types[1], true);
            }
            else if (union.types[1].kind == ts.SyntaxKind.NullKeyword || union.types[1].kind == ts.SyntaxKind.UndefinedKeyword) {
                return Type.from(union.types[0], true);
            }
        }
        throw `Unsupported type union, only unions between null or undefined and a single type supported`;
    }
    static from(type, optional) {
        try {
            switch (type.kind) {
                case ts.SyntaxKind.AnyKeyword:
                    return new AnyType();
                case ts.SyntaxKind.BooleanKeyword:
                    return new BooleanType(optional);
                case ts.SyntaxKind.NumberKeyword:
                    return new NumberType(optional);
                case ts.SyntaxKind.StringKeyword:
                    return new StringType(optional);
                case ts.SyntaxKind.TypeReference:
                    return Type.fromReference(type);
                case ts.SyntaxKind.UnionType:
                    return Type.fromUnion(type);
                default:
                    throw `Unsupported type ${ts.SyntaxKind[type.kind]}`;
            }
        }
        catch (error) {
            log.warn(`${error}, erasing to Any`, type);
            return new AnyType();
        }
    }
}
class AnyType extends Type {
    constructor(optional) {
        super(optional);
    }
}
class StringType extends Type {
    constructor(optional) {
        super(optional);
    }
}
class NumberType extends Type {
    constructor(optional) {
        super(optional);
    }
}
class BooleanType extends Type {
    constructor(optional) {
        super(optional);
    }
}
class GenericType extends Type {
    constructor(type, optional) {
        super(optional);
        let typeArguments = [];
        for (let typeArgument of type.typeArguments) {
            typeArguments.push(Type.from(typeArgument));
        }
        this.typeArguments = typeArguments;
    }
}
class ArrayType extends GenericType {
    constructor(type, optional) {
        super(type, optional);
    }
}
class VariableDeclaration {
    constructor(node) {
        this.name = node.name.text;
        this.type = Type.from(node.type);
        this.const = (node.parent.flags & ts.NodeFlags.Const) != 0;
    }
}
class SourceFile {
    constructor(node) {
        this.name = Path.parse(node.fileName).name;
        let declarations = [];
        for (let statement of node.statements) {
            if (!(statement.flags & ts.NodeFlags.Export)) {
                log.info(`Skipping unexported ${ts.SyntaxKind[statement.kind]}`, statement);
            }
            else
                switch (statement.kind) {
                    case ts.SyntaxKind.VariableStatement:
                        for (let declaration of statement.declarationList.declarations) {
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
class Module {
    constructor(file) {
        let path = Path.parse(file);
        this.src = path.base;
        this.name = path.name;
        let files = [];
        try {
            log.debug(`Attempting to open sourcemap at ` + Path.relative('.', `${file}.map`));
            let map = JSON.parse(fs_1.readFileSync(`${file}.map`).toString());
            log.debug(`Sourcemap found with ${map.sources.length} source(s)`);
            for (let source of map.sources) {
                let filename = `${map.sourceRoot}${source}`;
                log.info(`Parsing ` + Path.relative('.', filename));
                files.push(new SourceFile(ts.createSourceFile(filename, fs_1.readFileSync(filename).toString(), ts.ScriptTarget.ES6, true)));
            }
        }
        catch (error) {
            log.debug(`No sourcemap found, parsing ` + Path.relative('.', file));
            files = [new SourceFile(ts.createSourceFile(file, fs_1.readFileSync(file).toString(), ts.ScriptTarget.ES6, true))];
        }
        this.files = files;
    }
}
let filename = process.argv[2];
if (filename == undefined) {
    log.debug('No filename supplied attempting to open package.json in current directory');
}
else {
    let module = new Module(filename);
    console.log(JSON.stringify(module, (key, value) => {
        return value ? Object.assign(value, { kind: value.constructor.name }) : value;
    }, 4));
}
//# sourceMappingURL=main.js.map