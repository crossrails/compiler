"use strict";
const fs_1 = require('fs');
const Path = require('path');
//import * as doctrine from 'doctrine';
const ts = require("typescript");
const log_1 = require("./log");
class Type {
    constructor(optional) {
        this.optional = optional;
    }
    static from(type, optional) {
        try {
            switch (type.kind) {
                case ts.SyntaxKind.AnyKeyword:
                    return new AnyType(optional);
                case ts.SyntaxKind.BooleanKeyword:
                    return new BooleanType(optional);
                case ts.SyntaxKind.NumberKeyword:
                    return new NumberType(optional);
                case ts.SyntaxKind.StringKeyword:
                    return new StringType(optional);
                case ts.SyntaxKind.TypeReference:
                    return Type.fromReference(type, optional);
                case ts.SyntaxKind.UnionType:
                    return Type.fromUnion(type);
                default:
                    throw `Unsupported type ${ts.SyntaxKind[type.kind]}`;
            }
        }
        catch (error) {
            log_1.default.warn(`${error}, erasing to Any`, type);
            return new AnyType(optional);
        }
    }
    static fromReference(reference, optional) {
        let identifier = reference.typeName;
        switch (identifier.text) {
            case 'Array':
                return new ArrayType(reference, optional);
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
}
exports.Type = Type;
class GenericType extends Type {
    constructor(type, optional) {
        super(optional);
        let typeArguments = [];
        for (let typeArgument of type.typeArguments) {
            typeArguments.push(Type.from(typeArgument, false));
        }
        this.typeArguments = typeArguments;
    }
}
exports.GenericType = GenericType;
class AnyType extends Type {
}
exports.AnyType = AnyType;
class StringType extends Type {
}
exports.StringType = StringType;
class NumberType extends Type {
}
exports.NumberType = NumberType;
class BooleanType extends Type {
}
exports.BooleanType = BooleanType;
class ArrayType extends GenericType {
}
exports.ArrayType = ArrayType;
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
        this.type = Type.from(node.type, false);
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
//# sourceMappingURL=types.js.map