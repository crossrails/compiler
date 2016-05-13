"use strict";
const nunjucks_1 = require('nunjucks');
const log_1 = require("./log");
const ast = require("./ast");
const fs_1 = require('fs');
let filename = process.argv[2];
if (filename == undefined) {
    log_1.default.debug('No filename supplied attempting to read package.json');
}
else {
    let module = new ast.Module(filename);
    log_1.default.debug(module.identifiers.entries());
    // console.log(JSON.stringify(module, (key, value) => {
    //     return value ? Object.assign(value, { kind: value.constructor.name }) : value;
    // }, 4));   
    // let transpiler = new Transpiler(require("./languages/swift"), require("./engines/swift/javascriptcore"));
    // transpiler.transpile(module);
    var nunjucks = new nunjucks_1.Environment(new nunjucks_1.FileSystemLoader('src/swift'), {
        autoescape: false,
        // throwOnUndefined: true,
        tags: {
            blockStart: '<%',
            blockEnd: '%>',
            variableStart: '<$',
            variableEnd: '$>',
            commentStart: '<#',
            commentEnd: '#>'
        }
    });
    nunjucks.addFilter('indent', (text, direction) => {
        let indent = /^( *)\S/m.exec(text)[1].length;
        return text.replace(new RegExp(`^ {${indent}}`, 'gm'), "    ".repeat(indent / 4 + direction));
    });
    nunjucks.addFilter('array', (iterable) => {
        return Array.from(iterable);
    });
    nunjucks.addFilter('kind', (object) => {
        return object.constructor.name;
    });
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
    require("./swift/swift");
    for (let file of module.files) {
        fs_1.writeFile(`${file.filename}.swift`, nunjucks.render('javascriptcore.njk', {
            file: file,
            module: module,
        }));
    }
}
//# sourceMappingURL=main.js.map