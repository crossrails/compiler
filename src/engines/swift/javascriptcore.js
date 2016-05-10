"use strict";
class JavaScriptCore {
    constructor() {
        this.identifiers = new Set();
    }
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
    emitVariable(node, out) {
        this.identifiers.add(node.name);
        // = this[.name].infer()
    }
}
module.exports = new JavaScriptCore();
//# sourceMappingURL=javascriptcore.js.map