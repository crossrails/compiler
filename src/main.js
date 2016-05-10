"use strict";
const log_1 = require("./log");
const emitter_1 = require("./emitter");
const ast_1 = require("./ast");
let filename = process.argv[2];
if (filename == undefined) {
    log_1.default.debug('No filename supplied attempting to read package.json');
}
else {
    let module = new ast_1.Module(filename);
    // console.log(JSON.stringify(module, (key, value) => {
    //     return value ? Object.assign(value, { kind: value.constructor.name }) : value;
    // }, 4));
    emit(module, require("./languages/swift").default, require("./engines/swift/javascriptcore").default);
}
function emit(module, language, engine) {
    emitter_1.emitNode(module, language.emitModule, engine.emitModule, () => {
        for (let file of module.files) {
            emitter_1.emitNode(file, language.emitSourceFile, engine.emitSourceFile, () => {
                for (let declaration of file.declarations) {
                    declaration.accept({
                        visitVariable(node) {
                            emitter_1.emitNode(node, language.emitVariable, engine.emitVariable);
                        },
                        visitClass(node) {
                            emitter_1.emitNode(node, language.emitClass, engine.emitClass);
                        },
                        visitMethod(node) {
                            emitter_1.emitNode(node, language.emitMethod, engine.emitMethod);
                        }
                    });
                }
            });
        }
    });
}
//# sourceMappingURL=main.js.map