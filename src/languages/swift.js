"use strict";
class Swift {
    emitModule(node, out) {
    }
    emitSourceFile(node, out) {
        //insert header comment
        out.writeFile(`${node.filename}.swift`, `import Foundation\n\n`);
    }
    emitVariable(node, out) {
        //public let name :Any        
    }
    emitClass(node, out) {
    }
    emitMethod(node, out) {
    }
}
module.exports = new Swift();
//# sourceMappingURL=swift.js.map