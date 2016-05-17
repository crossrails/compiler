"use strict";
const log_1 = require("./log");
const ast_1 = require("./ast");
const emitter_1 = require("./emitter");
const swift_1 = require('./swift/swift');
const args = require('yargs');
let options = args
    .usage('Usage: $0 [file] [options]')
    .demand(1)
    .example('$0 src.min.js --swift', 'Compile to swift, outputting beside original source files')
    .example('$0 src.js --java.outDir java', 'Compile to java, outputting to a java subdirectory')
    .alias('v', 'version').version()
    .help('h').alias('h', 'help')
    .group(['p', 'l', 'h', 'v'], 'Global options:')
    .option('p', {
    config: true,
    alias: 'project',
    describe: 'Path to a xrails.json project config file (or to a directory containing one)',
    type: 'string'
})
    .option('l', {
    alias: 'logLevel',
    default: 'warning',
    describe: 'Set the complier log level',
    choices: ['debug', 'info', 'warning', 'error']
})
    .options(swift_1.SwiftEmitter.options)
    .options(emitter_1.Emitter.options)
    .epilog('General options can be applied globally or to any language or engine, e.g. swift.outDir or swift.javascriptcore.outDir')
    .argv;
let filename = args.argv._[0];
if (options.logLevel) {
    log_1.log.setLevel(options.logLevel);
}
if (filename == undefined) {
    log_1.log.debug('No filename supplied attempting to read package.json');
}
else {
    let module = new ast_1.Module(filename);
    // console.log(JSON.stringify(module, (key, value) => {
    //     return value ? Object.assign(value, { kind: value.constructor.name }) : value;
    // }, 4));       
    if (options.swift) {
        let emitter = new swift_1.SwiftEmitter(module);
        emitter.emit(Object.assign({}, options, options.swift));
    }
    if (!(options.swift || options.java)) {
        log_1.log.error("No output languages specified use --java or --swift");
    }
}
//# sourceMappingURL=main.js.map