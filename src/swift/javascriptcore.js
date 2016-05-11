"use strict";
const ast = require("../ast");
class JavaScriptCore {
    constructor() {
        this.identifiers = new Set();
    }
    // constructor(visitor: ast.TypeVisitor<string>) {
    //     this.visitor = visitor;
    // }
    emitModule(node, out) {
        out.emitChildren();
        out.copyFile('javascriptcore.swift', 'js.swift');
        let file = `${node.name}.swift`;
        if (!out.fileExists(file)) {
            out.writeFile(file, `import Foundation\n\n`);
        }
        out.writeFile(file, `var this :JSInstance = try! JSContext().eval(NSBundle(identifier: "io.xrails.src")!.pathForResource("src", ofType: "js")!)\n\n`);
        out.writeFile(file, `extension JSProperty {\n`);
        for (let identifier of this.identifiers) {
            out.writeFile(file, `    static let ${identifier} : JSProperty = "${identifier}"\n`);
        }
        out.writeFile(file, `}\n`);
        //add extension JSProperty {}
        //define global this 
    }
    emitSourceFile(node, out) {
        out.emitChildren();
    }
    emitClass(node, out) {
        this.identifiers.add(node.name);
    }
    emitMethod(node, out) {
        this.identifiers.add(node.name);
    }
    emitConstant(node, out) {
        this.identifiers.add(node.name);
        if (node.type instanceof ast.AnyType) {
            out.writeFile(`${node.sourceFile.filename}.swift`, ` = this[.${node.name}].infer()`);
        }
        else {
            out.writeFile(`${node.sourceFile.filename}.swift`, ` = ${node.type.accept(this.visitor)}(this[.${node.name}])\n\n`);
        }
    }
    emitVariable(node, out) {
        this.identifiers.add(node.name);
        if (node.type instanceof ast.AnyType) {
            out.writeFile(`${node.sourceFile.filename}.swift`, ` {
    get {
        return this[.${node.name}].infer()
    }
    set {
        this[.${node.name}] =  this.valueOf(newValue)
    }
}`);
        }
        else {
            out.writeFile(`${node.sourceFile.filename}.swift`, ` {
    get {
        return ${node.type.accept(this.visitor)}(this[.${node.name}])
    }
    set {
        this[.${node.name}] =  this.valueOf(newValue)
    }
}\n\n`);
        }
    }
}
module.exports = new JavaScriptCore();
//# sourceMappingURL=javascriptcore.js.map