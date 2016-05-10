"use strict";
function emitNode(node, emitInterface, emitImplementation, emitChildren) {
    emitInterface(node, {
        emitChildren() {
            let emitter = this.emit;
            emitImplementation(node, {
                emitChildren: emitChildren,
                emit: emitter
            });
        },
        emit(file, output) {
            console.log(`${output} >> ${file}`);
        }
    });
}
exports.emitNode = emitNode;
//# sourceMappingURL=emitter.js.map