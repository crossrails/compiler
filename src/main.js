"use strict";
const log_1 = require("./log");
const ast_1 = require("./ast");
const swift_1 = require('./swift/swift');
const args = require('yargs');
let options = args.argv;
let filename = args.argv._[0];
if (filename == undefined) {
    log_1.default.debug('No filename supplied attempting to read package.json');
}
else {
    let module = new ast_1.Module(filename);
    // console.log(JSON.stringify(module, (key, value) => {
    //     return value ? Object.assign(value, { kind: value.constructor.name }) : value;
    // }, 4));       
    if (options.swift) {
        let emitter = new swift_1.SwiftEmitter(module);
        log_1.default.debug(options.swift.outDir);
        emitter.emit(Object.assign({}, options, options.swift));
    }
}
//# sourceMappingURL=main.js.map