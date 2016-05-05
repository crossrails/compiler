"use strict";
const log_1 = require("./log");
const ast = require("./types");
let filename = process.argv[2];
if (filename == undefined) {
    log_1.default.debug('No filename supplied attempting to read package.json');
}
else {
    let module = new ast.Module(filename);
    let json = JSON.stringify(module, (key, value) => {
        return value ? Object.assign(value, { kind: value.constructor.name }) : value;
    }, 4);
    console.log(json);
    let object = JSON.parse(json, (key, value) => {
        return value.kind ? Object.assign(new ast[value.kind], value) : value;
    });
    console.log(JSON.stringify(object));
}
//# sourceMappingURL=main.js.map