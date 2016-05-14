"use strict";
const emitter_1 = require("../emitter");
const nunjucks_1 = require('nunjucks');
const fs_1 = require('fs');
class SwiftEmitter extends emitter_1.Emitter {
    get loader() {
        return new nunjucks_1.FileSystemLoader('src/swift');
    }
    get defaultOptions() {
        return {
            engine: 'javascriptcore',
            bundleId: undefined
        };
    }
    addFilters(nunjucks) {
        nunjucks.addFilter('keyword', (variable) => {
            return variable.constant ? 'let' : 'var';
        });
        nunjucks.addFilter('signature', (type) => {
            return type.accept({
                visitAnyType(node) {
                    return 'Any';
                },
                visitStringType(node) {
                    return 'String';
                },
                visitNumberType(node) {
                    return 'Double';
                },
                visitBooleanType(node) {
                    return 'Bool';
                },
                visitArrayType(node) {
                    return `[${node.typeArguments[0].accept(this)}]`;
                }
            }) + (type.optional ? '?' : '');
        });
    }
    writeFiles(module, nunjucks, options) {
        for (let file of module.files) {
            fs_1.writeFile(`${file.filename}.swift`, nunjucks.render(`${options.engine || 'javascriptcore'}.njk`, {
                file: file,
                module: module,
                bundleId: options.bundleId
            }));
        }
    }
}
exports.SwiftEmitter = SwiftEmitter;
//# sourceMappingURL=swift.js.map