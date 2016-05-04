"use strict";
//import * as doctrine from 'doctrine';
const ts = require("typescript");
const log_1 = require("./log");
const ast_1 = require("./ast");
ast_1.Type.from = function (type, optional) {
    try {
        switch (type.kind) {
            case ts.SyntaxKind.AnyKeyword:
                return new ast_1.AnyType(optional);
            case ts.SyntaxKind.BooleanKeyword:
                return new ast_1.BooleanType(optional);
            case ts.SyntaxKind.NumberKeyword:
                return new ast_1.NumberType(optional);
            case ts.SyntaxKind.StringKeyword:
                return new ast_1.StringType(optional);
            case ts.SyntaxKind.TypeReference:
                return ast_1.Type.fromReference(type, optional);
            case ts.SyntaxKind.UnionType:
                return ast_1.Type.fromUnion(type);
            default:
                throw `Unsupported type ${ts.SyntaxKind[type.kind]}`;
        }
    }
    catch (error) {
        log_1.default.warn(`${error}, erasing to Any`, type);
        return new ast_1.AnyType(optional);
    }
};
ast_1.Type.fromReference = function (reference, optional) {
    let identifier = reference.typeName;
    switch (identifier.text) {
        case 'Array':
            return ast_1.ArrayType.from(reference, optional);
        default:
            throw `Unsupported type reference ${identifier.text}`;
    }
};
ast_1.Type.fromUnion = function (union) {
    if (union.types.length == 2) {
        if (union.types[0].kind == ts.SyntaxKind.NullKeyword || union.types[0].kind == ts.SyntaxKind.UndefinedKeyword) {
            return ast_1.Type.from(union.types[1], true);
        }
        else if (union.types[1].kind == ts.SyntaxKind.NullKeyword || union.types[1].kind == ts.SyntaxKind.UndefinedKeyword) {
            return ast_1.Type.from(union.types[0], true);
        }
    }
    throw `Unsupported type union, only unions between null or undefined and a single type supported`;
};
ast_1.GenericType.from = function (type, optional) {
    let typeArguments = [];
    for (let typeArgument of type.typeArguments) {
        typeArguments.push(ast_1.Type.from(typeArgument));
    }
    this.typeArguments = typeArguments;
    return new ast_1.GenericType(optional, typeArguments);
};
//# sourceMappingURL=types.js.map