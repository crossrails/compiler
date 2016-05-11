"use strict";
const ast = require("../ast");
class Swift {
    emitModule(node, out) {
    }
    emitSourceFile(node, out) {
        //insert header comment
        out.writeFile(`${node.filename}.swift`, `import Foundation\n\n`);
    }
    emitConstant(node, out) {
        if (node.type instanceof ast.AnyType) {
        }
        else {
        }
    }
    emitVariable(node, out) {
        let keyword = node.constant ? 'let' : 'var';
        out.writeFile(`${node.sourceFile.filename}.swift`, `public ${keyword} ${node.name} :${node.type.accept(this)}`);
    }
    emitClass(node, out) {
    }
    emitMethod(node, out) {
    }
    visitAnyType(node) {
        return `Any`;
    }
    visitStringType(node) {
        return 'String';
    }
    visitNumberType(node) {
        return 'Double';
    }
    visitBooleanType(node) {
        return 'Bool';
    }
    visitArrayType(node) {
        return `[${node.typeArguments[0].accept(this)}]`;
    }
}
module.exports = new Swift();
//# sourceMappingURL=swift.js.map