import {log} from "./log"
import {Module} from "./ast"
import {Compiler, CompilerOptions} from "./compiler"

import args = require('yargs');

let options: CompilerOptions & {logLevel?: string} = args
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
    .options({
        'swift': { 
            group: 'Swift options:',
            desc: 'Compile source to swift (enabled automatically if any swift option specified e.g. swift.outDir=gen)' 
        },
        'swift.javascriptcore': { 
            group: 'Swift options:',
            desc: 'Compile source to use the JavaScriptCore engine under the hood [default]',
        },
        'swift.bundleId': { 
            group: 'Swift options:',
            desc: 'The id of the bundle containing the javascript source file, omit to use the main bundle',
            type: 'string'             
        }
    })
    .options({ 
        'outDir': { 
            group: 'General options:',
            desc: 'Redirect output structure to a directory',
            type: 'string',
            default: '.'             
        },
        'noEmit': { 
            group: 'General options:',
            desc: 'Do not emit complied output',
            type: 'boolean',             
            default: false             
        },
        'noEmitWrapper': { 
            group: 'General options:',
            desc: 'Do not emit the wrapper for the specified JS engine in compiled output',
            type: 'boolean',         
            default: false             
        }
    })
    .epilog('General options can be applied globally or to any language or engine, e.g. swift.outDir or swift.javascriptcore.outDir')
    .argv;
    

if(options.logLevel) {
    log.setLevel(options.logLevel);
}

let compiler = new Compiler(options, new Map([
    [`swift`,   [`javascriptcore`]], 
    ['java',    [`nashorn`, 'javascriptcore']],
    [`csharp`,  [`chakracore`]], 
    [`php`,     [`v8`]], 
]));

let filename: string|undefined = args.argv._[0];

if(filename == undefined) {
    log.debug('No filename supplied attempting to read package.json')
    //todo
} else {
    compiler.compile(new Module(filename));
    // console.log(JSON.stringify(module, (key, value) => {
    //     return value ? Object.assign(value, { kind: value.constructor.name }) : value;
    // }, 4));       
}
