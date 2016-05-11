import {Environment as Nunjucks, FileSystemLoader} from 'nunjucks'
import log from "./log"
import {Transpiler} from "./transpiler" 
import {Module, Type, SourceFile} from "./ast" 

let filename: string|undefined = process.argv[2];

if(filename == undefined) {
    log.debug('No filename supplied attempting to read package.json')
} else {
    let module = new Module(filename);
    // console.log(JSON.stringify(module, (key, value) => {
    //     return value ? Object.assign(value, { kind: value.constructor.name }) : value;
    // }, 4));   
    // let transpiler = new Transpiler(require("./languages/swift"), require("./engines/swift/javascriptcore"));
    // transpiler.transpile(module);
    var nunjucks = new Nunjucks(new FileSystemLoader('src/swift'), { 
        autoescape: false, 
        throwOnUndefined: true,
        trimBlocks: false,
        lstripBlocks: true,
        tags: {
            blockStart: '<%',
            blockEnd: '%>',
            variableStart: '<$',
            variableEnd: '$>',
            commentStart: '<#',
            commentEnd: '#>'
        }
    });
    nunjucks.addFilter('typename', (type: Type) => {
        return type.constructor.name;
    });
    for(let file of module.files as Array<SourceFile>) {
        console.log(nunjucks.render('swift.njk', {
            file: file,
            module: module, 
        }));
    }
}
