"use strict";
let emitter = {
    emitModule(node, out) {
        out.emitChildren();
    },
    emitSourceFile(node, out) {
        //insert header comment
        out.emit(`${node.filename}.swift`, `import Foundation\n`);
        out.emitChildren();
    },
    emitVariable(node, out) {
        //public let name :Any        
    },
    emitClass(node, out) {
    },
    emitMethod(node, out) {
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = emitter;
//# sourceMappingURL=swift.js.map