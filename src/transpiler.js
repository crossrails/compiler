"use strict";
class Transpiler {
    constructor(language, engine) {
        this.language = language;
        this.engine = engine;
        this.files = new Map();
    }
    transpile(module) {
        this.emitNode(module, this.language.emitModule, this.engine.emitModule, () => {
            for (let file of module.files) {
                this.emitNode(file, this.language.emitSourceFile, this.engine.emitSourceFile, () => {
                    for (let declaration of file.declarations) {
                        declaration.accept(this);
                    }
                });
            }
        });
        for (let entry of this.files) {
            console.log(`FILE ${entry[0]}:`);
            console.log(entry[1]);
        }
    }
    visitVariable(node) {
        this.emitNode(node, this.language.emitVariable, this.engine.emitVariable);
    }
    visitClass(node) {
        this.emitNode(node, this.language.emitClass, this.engine.emitClass);
    }
    visitMethod(node) {
        this.emitNode(node, this.language.emitMethod, this.engine.emitMethod);
    }
    emitNode(node, emitInterface, emitImplementation, emitChildren = () => { }) {
        let self = this;
        let implementationEmitted = false;
        let output = {
            fileExists(file) {
                return self.files.has(file);
            },
            copyFile(source, destination) {
            },
            writeFile(file, output) {
                self.files.set(file, !self.files.has(file) ? output : self.files.get(file) + output);
            },
            emitChildren() {
                let childrenEmitted = false;
                emitImplementation.apply(self.engine, [node, {
                        fileExists: this.fileExists,
                        copyFile: this.copyFile,
                        writeFile: this.writeFile,
                        emitChildren() {
                            emitChildren();
                            childrenEmitted = true;
                        }
                    }]);
                if (!childrenEmitted) {
                    emitChildren();
                }
                implementationEmitted = true;
            }
        };
        emitInterface.apply(self.language, [node, output]);
        if (!implementationEmitted) {
            output.emitChildren();
        }
    }
}
exports.Transpiler = Transpiler;
//# sourceMappingURL=transpiler.js.map