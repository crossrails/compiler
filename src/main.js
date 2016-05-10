"use strict";
const log_1 = require("./log");
const transpiler_1 = require("./transpiler");
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
    let transpiler = new transpiler_1.Transpiler(require("./languages/swift"), require("./engines/swift/javascriptcore"));
    transpiler.transpile(module);
}
//# sourceMappingURL=main.js.map