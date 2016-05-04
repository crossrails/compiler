"use strict";
class Module {
    constructor(name, src, files) {
        this.name = name;
        this.src = src;
        this.files = files;
    }
}
exports.Module = Module;
class Declaration {
    constructor(name, comment) {
        this.name = name;
        this.comment = comment;
    }
}
exports.Declaration = Declaration;
class SourceFile extends Declaration {
    constructor(name, comment, declarations) {
        super(name, comment);
        this.declarations = declarations;
    }
}
exports.SourceFile = SourceFile;
class ClassDeclaration extends Declaration {
    constructor(name, comment, superClass, methods) {
        super(name, comment);
        this.superClass = superClass;
        this.methods = methods;
    }
}
exports.ClassDeclaration = ClassDeclaration;
class MethodDeclaration extends Declaration {
    constructor(name, comment, abstract) {
        super(name, comment);
        this.abstract = abstract;
    }
}
exports.MethodDeclaration = MethodDeclaration;
class VariableDeclaration extends Declaration {
    constructor(name, comment, type, constant) {
        super(name, comment);
        this.type = type;
        this.constant = constant;
    }
}
exports.VariableDeclaration = VariableDeclaration;
class Type {
    constructor(optional) {
        this.optional = optional;
    }
}
exports.Type = Type;
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
class GenericType extends Type {
    constructor(
        /*readonly*/ optional, typeArguments) {
        super(optional);
        this.typeArguments = typeArguments;
    }
}
exports.GenericType = GenericType;
class ArrayType extends GenericType {
}
exports.ArrayType = ArrayType;
//# sourceMappingURL=ast.js.map