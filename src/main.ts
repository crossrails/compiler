import log from "./log"
import {Transpiler} from "./transpiler" 
import {Module} from "./ast" 

let filename: string|undefined = process.argv[2];

if(filename == undefined) {
    log.debug('No filename supplied attempting to read package.json')
} else {
    let module = new Module(filename);
    // console.log(JSON.stringify(module, (key, value) => {
    //     return value ? Object.assign(value, { kind: value.constructor.name }) : value;
    // }, 4));
    let transpiler = new Transpiler(require("./languages/swift").default, require("./engines/swift/javascriptcore").default);
    transpiler.transpile(module);
}
