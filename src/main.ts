import log from "./log"
import {Module} from "./ast" 
import {EmitterOptions} from './emitter'
import {SwiftEmitter, SwiftOptions} from './swift/swift'
import args = require('yargs');

interface CompilerOptions {
   swift?: SwiftOptions
   java?: CompilerOptions & { engine?: 'nashorn'|'android-jsc', bundleId?: string }
   version?: boolean
}

let options: CompilerOptions  = args.argv;
let filename: string|undefined = args.argv._[0];

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
}
