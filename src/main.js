"use strict";
const nunjucks_1 = require('nunjucks');
const log_1 = require("./log");
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
    // let transpiler = new Transpiler(require("./languages/swift"), require("./engines/swift/javascriptcore"));
    // transpiler.transpile(module);
    var nunjucks = new nunjucks_1.Environment(new nunjucks_1.FileSystemLoader('src/swift'), {
        autoescape: false,
        throwOnUndefined: true,
        trimBlocks: false,
        lstripBlocks: true,
        tags: {
            blockStart: '<%',
            blockEnd: '%>',
            variableStart: '<$',
            variableEnd: '$>',
            commentStart: '<#',
            commentEnd: '#>'
        }
    });
    nunjucks.addFilter('typename', (type) => {
        return type.constructor.name;
    });
    for (let file of module.files) {
        console.log(nunjucks.render('swift.njk', {
            file: file,
            module: module,
        }) + 'end');
    }
}
//# sourceMappingURL=main.js.map