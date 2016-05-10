"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var fs_1 = require('fs');
var Path = require('path');
//import * as doctrine from 'doctrine';
var ts = require("typescript");
var log_1 = require("./log");
var Declaration = (function () {
    function Declaration(node, parent) {
        this.parent = parent;
        this.name = node.name.text;
    }
    Object.defineProperty(Declaration.prototype, "module", {
        get: function () {
            return this.parent.module;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Declaration.prototype, "sourceFile", {
        get: function () {
            return this.parent.sourceFile;
        },
        enumerable: true,
        configurable: true
    });
    return Declaration;
}());
exports.Declaration = Declaration;
var VariableDeclaration = (function (_super) {
    __extends(VariableDeclaration, _super);
    function VariableDeclaration(node, parent) {
        _super.call(this, node, parent);
        if (node.type) {
            this.type = Type.from(node.type, false);
        }
        else {
            log_1.default.warn("Type information missing, resorting to Any", node);
            this.type = new AnyType(false);
        }
        this.constant = (node.parent && node.parent.flags & ts.NodeFlags.Const) != 0;
    }
    VariableDeclaration.prototype.accept = function (visitor) {
        visitor.visitVariable(this);
    };
    return VariableDeclaration;
}(Declaration));
exports.VariableDeclaration = VariableDeclaration;
var ClassDeclaration = (function (_super) {
    __extends(ClassDeclaration, _super);
    function ClassDeclaration() {
        _super.apply(this, arguments);
    }
    ClassDeclaration.prototype.accept = function (visitor) {
        visitor.visitClass(this);
    };
    return ClassDeclaration;
}(Declaration));
exports.ClassDeclaration = ClassDeclaration;
var MethodDeclaration = (function (_super) {
    __extends(MethodDeclaration, _super);
    function MethodDeclaration() {
        _super.apply(this, arguments);
    }
    MethodDeclaration.prototype.accept = function (visitor) {
        visitor.visitMethod(this);
    };
    return MethodDeclaration;
}(Declaration));
exports.MethodDeclaration = MethodDeclaration;
var SourceFile = (function () {
    function SourceFile(node, module) {
        // console.log(JSON.stringify(ts.createSourceFile(node.fileName, readFileSync(node.fileName).toString(), ts.ScriptTarget.ES6, false), (key, value) => {
        //     return value ? Object.assign(value, { kind: ts.SyntaxKind[value.kind], flags: ts.NodeFlags[value.flags] }) : value;
        // }, 4));
        this.filename = Path.parse(node.fileName).name;
        this.module = module;
        var declarations = [];
        for (var _i = 0, _a = node.statements; _i < _a.length; _i++) {
            var statement = _a[_i];
            if (!(statement.flags & ts.NodeFlags.Export)) {
                log_1.default.info("Skipping unexported " + ts.SyntaxKind[statement.kind], statement);
            }
            else
                switch (statement.kind) {
                    case ts.SyntaxKind.VariableStatement:
                        for (var _b = 0, _c = statement.declarationList.declarations; _b < _c.length; _b++) {
                            var declaration = _c[_b];
                            declarations.push(new VariableDeclaration(declaration, this));
                        }
                        break;
                    default:
                        log_1.default.warn("Skipping " + ts.SyntaxKind[statement.kind], statement);
                }
        }
        this.declarations = declarations;
    }
    Object.defineProperty(SourceFile.prototype, "sourceFile", {
        get: function () {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    return SourceFile;
}());
exports.SourceFile = SourceFile;
var Module = (function () {
    function Module(file) {
        var path = Path.parse(file);
        this.src = path.base;
        var files = [];
        try {
            log_1.default.debug("Attempting to open sourcemap at " + Path.relative('.', file + ".map"));
            var map = JSON.parse(fs_1.readFileSync(file + ".map").toString());
            log_1.default.debug("Sourcemap found with " + map.sources.length + " source(s)");
            for (var _i = 0, _a = map.sources; _i < _a.length; _i++) {
                var source = _a[_i];
                var filename = "" + map.sourceRoot + source;
                log_1.default.info("Parsing " + Path.relative('.', filename));
                files.push(new SourceFile(ts.createSourceFile(filename, fs_1.readFileSync(filename).toString(), ts.ScriptTarget.ES6, true), this));
            }
        }
        catch (error) {
            log_1.default.debug("No sourcemap found, parsing " + Path.relative('.', file));
            files = [new SourceFile(ts.createSourceFile(file, fs_1.readFileSync(file).toString(), ts.ScriptTarget.ES6, true), this)];
        }
        this.files = files;
    }
    return Module;
}());
exports.Module = Module;
var Type = (function () {
    function Type(optional) {
        this.optional = optional;
    }
    Type.from = function (type, optional) {
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
                    throw "Unsupported type " + ts.SyntaxKind[type.kind];
            }
        }
        catch (error) {
            log_1.default.warn(error + ", erasing to Any", type);
            return new AnyType(optional);
        }
    };
    Type.fromReference = function (reference, optional) {
        var identifier = reference.typeName;
        switch (identifier.text) {
            case 'Array':
                return new ArrayType(reference, optional);
            default:
                throw "Unsupported type reference " + identifier.text;
        }
    };
    Type.fromUnion = function (union) {
        if (union.types.length == 2) {
            if (union.types[0].kind == ts.SyntaxKind.NullKeyword || union.types[0].kind == ts.SyntaxKind.UndefinedKeyword) {
                return Type.from(union.types[1], true);
            }
            else if (union.types[1].kind == ts.SyntaxKind.NullKeyword || union.types[1].kind == ts.SyntaxKind.UndefinedKeyword) {
                return Type.from(union.types[0], true);
            }
        }
        throw "Unsupported type union, only unions between null or undefined and a single type supported";
    };
    return Type;
}());
exports.Type = Type;
var GenericType = (function (_super) {
    __extends(GenericType, _super);
    function GenericType(type, optional) {
        _super.call(this, optional);
        var typeArguments = [];
        if (type.typeArguments)
            for (var _i = 0, _a = type.typeArguments; _i < _a.length; _i++) {
                var typeArgument = _a[_i];
                typeArguments.push(Type.from(typeArgument, false));
            }
        this.typeArguments = typeArguments;
    }
    return GenericType;
}(Type));
exports.GenericType = GenericType;
var AnyType = (function (_super) {
    __extends(AnyType, _super);
    function AnyType() {
        _super.apply(this, arguments);
    }
    AnyType.prototype.accept = function (visitor) {
        return visitor.visitAnyType(this);
    };
    return AnyType;
}(Type));
exports.AnyType = AnyType;
var StringType = (function (_super) {
    __extends(StringType, _super);
    function StringType() {
        _super.apply(this, arguments);
    }
    StringType.prototype.accept = function (visitor) {
        return visitor.visitStringType(this);
    };
    return StringType;
}(Type));
exports.StringType = StringType;
var NumberType = (function (_super) {
    __extends(NumberType, _super);
    function NumberType() {
        _super.apply(this, arguments);
    }
    NumberType.prototype.accept = function (visitor) {
        return visitor.visitNumberType(this);
    };
    return NumberType;
}(Type));
exports.NumberType = NumberType;
var BooleanType = (function (_super) {
    __extends(BooleanType, _super);
    function BooleanType() {
        _super.apply(this, arguments);
    }
    BooleanType.prototype.accept = function (visitor) {
        return visitor.visitBooleanType(this);
    };
    return BooleanType;
}(Type));
exports.BooleanType = BooleanType;
var ArrayType = (function (_super) {
    __extends(ArrayType, _super);
    function ArrayType() {
        _super.apply(this, arguments);
    }
    ArrayType.prototype.accept = function (visitor) {
        return visitor.visitArrayType(this);
    };
    return ArrayType;
}(GenericType));
exports.ArrayType = ArrayType;
//# sourceMappingURL=ast.js.map