"use strict";
var emitter = {
    emitModule: function (node, out) {
        out.emitChildren();
    },
    emitSourceFile: function (node, out) {
        //insert header comment
        out.emit(node.filename + ".swift", "import Foundation\n");
        out.emitChildren();
    },
    emitVariable: function (node, out) {
        //public let name :Any        
    },
    emitClass: function (node, out) {
    },
    emitMethod: function (node, out) {
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = emitter;
//# sourceMappingURL=swift.js.map