"use strict";
const log_1 = require("./log");
const ast_1 = require("./ast");
require("./declarations");
const ast = require("./ast");
let filename = process.argv[2];
if (filename == undefined) {
    log_1.default.debug('No filename supplied attempting to read package.json');
}
else {
    let module = ast_1.Module.from(filename);
    let json = JSON.stringify(module, (key, value) => {
        return value ? Object.assign(value, { kind: value.constructor.name }) : value;
    }, 4);
    let object = JSON.parse(json, (key, value) => {
        return value.kind ? Object.assign(new ast[value.kind], value) : value;
    });
    console.log(JSON.stringify(object));
}
//# sourceMappingURL=main.js.map