import {log} from "./log"
import {Module} from "./ast" 
import {Emitter} from "./emitter" 
import {SwiftEmitter, SwiftOptions} from './swift/swift'
import args = require('yargs');

interface CompilerOptions {
   swift?: SwiftOptions
   java?: CompilerOptions & { engine?: 'nashorn'|'android-jsc', bundleId?: string }
   logLevel?: string
}


let options: CompilerOptions  = args
    .usage('Usage: $0 [file] [options]')
    .demand(1)
    .example('$0 src.min.js --swift', 'Transpiles to swift, outputting beside original source files')
    .example('$0 src.js --java.outDir java/src', 'Transpiles to java, outputting to the subdirectory java/src')
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
    .options(SwiftEmitter.options)
    .options(Emitter.options)
    .epilog('General options can be applied globally or to any language or engine, e.g. swift.outDir or swift.javascriptcore.outDir')
    .argv;
    
let filename: string|undefined = args.argv._[0];

if(options.logLevel) {
    log.setLevel(options.logLevel);
}

if(filename == undefined) {
    log.debug('No filename supplied attempting to read package.json')
} else {
    let module = new Module(filename);
    // console.log(JSON.stringify(module, (key, value) => {
    //     return value ? Object.assign(value, { kind: value.constructor.name }) : value;
    // }, 4));       
    if(options.swift) {
        let emitter = new SwiftEmitter(module);
        emitter.emit(Object.assign({}, options, options.swift));        
    }
    if(!(options.swift || options.java)) {
        log.error("No output languages specified use --java or --swift");
    }
}
