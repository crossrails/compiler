import log from "./log" 
import {Module} from "./declarations" 

let filename: string|undefined = process.argv[2];

if(filename == undefined) {
    log.debug('No filename supplied attempting to read package.json')
} else {
    let module = new Module(filename);
    let json = JSON.stringify(module, (key, value) => {
        return value ? Object.assign(value, { kind: value.constructor.name }) : value;
    }, 4);
    console.log(json);
    // let object: ast.Module = JSON.parse(json, (key, value) => {
    //     return value.kind ? Object.assign(new ast[value.kind], value) : value;
    // });
    // console.log(JSON.stringify(object));
}
