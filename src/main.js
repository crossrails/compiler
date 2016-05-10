"use strict";
var log_1 = require("./log");
var transpiler_1 = require("./transpiler");
var ast_1 = require("./ast");
var filename = process.argv[2];
if (filename == undefined) {
    log_1.default.debug('No filename supplied attempting to read package.json');
}
else {
    var module_1 = new ast_1.Module(filename);
    // console.log(JSON.stringify(module, (key, value) => {
    //     return value ? Object.assign(value, { kind: value.constructor.name }) : value;
    // }, 4));
    var transpiler = new transpiler_1.Transpiler(require("./languages/swift").default, require("./engines/swift/javascriptcore").default);
    transpiler.transpile(module_1);
}
//# sourceMappingURL=main.js.map