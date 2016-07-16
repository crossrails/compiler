#!/usr/bin/env node

import {log} from "./log"
import {Module} from "./ast"
import {Compiler, CompilerOptions} from "./compiler"

import yargs = require('yargs');

function main(...args: string[]): number {

    let options = yargs
        .usage('Usage: $0 [file.js] [options]')
        .demand(1)
        .check((argv: yargs.Argv, aliases: { [key: string]: string[] }) => {
            return !argv._[0] || argv._[0].endsWith('.js') ? true : 'File argument must be a javascript source file (.js)';
        })
        .example('$0 src.min.js --swift', 'Compile to swift, outputting beside original source files')
        .example('$0 src.js --java.outDir java', 'Compile to java, outputting to a java subdirectory')
        .alias('v', 'version').version()
        .help('h').alias('h', 'help')
        .group(['p', 'l', 'h', 'v', 'charset', 'implicitExport'], 'Global options:')
        .option('p', {
            config: true,
            alias: 'project',
            describe: 'Path to a xrails.json project config file (or to a directory containing one)',
            type: 'string'
        })
        .option('charset', {
            default: 'utf8',
            describe: 'The character set of the input files',
            type: 'string'
        })
        .option('sourceMap', {
            describe: 'Path to the source map of the input file, defaults to [file.js].map',
            type: 'string'
        })
        .option('implicitExport', {
            default: false,
            describe: 'Expose all declarations found (by default only those marked with export are exposed)',
            type: 'boolean'
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
                desc: 'The id of the bundle containing the JS source file, omit to use the main bundle',
                type: 'string'             
            },
            'swift.omitArgumentLabels': { 
                group: 'Swift options:',
                desc: 'Prefix all function arguments with _',
                default: false,             
                type: 'boolean'
            }
        })
        .options({
            'java': { 
                group: 'Java options:',
                desc: 'Compile source to java (enabled automatically if any java option specified e.g. java.outDir=gen)' 
            },
            'java.nashorn': { 
                group: 'Java options:',
                desc: 'Compile source to use the Nashorn engine under the hood, requires Java SE/EE [default]',
            },
            'java.basePackage': { 
                group: 'Java options:',
                desc: 'The base package to root the output structure in',
                type: 'string',  
                //required: true            
            }
        })
        .options({ 
            'emit': { 
                group: 'General options:',
                desc: 'Emit compiled output, specify a path to to redirect output structure, defaults to beside the input files [boolean]',
                default: true             
            },
            'emitJS': { 
                group: 'General options:',
                desc: 'Copy the input JavaScript source file into the compiled output, specify a path to override default location [boolean]',
                default: true             
            },
            'emitWrapper': { 
                group: 'General options:',
                desc: 'Copy the native wrapper for the JS engine into the compiled output, specify a path to override default location [boolean]',
                default: true             
            }
        })
        .epilog('General options can be applied globally or to any language or engine, e.g. swift.emit or swift.javascriptcore.emit')
        .parse<CompilerOptions & {sourceMap?: string, logLevel: string, charset: string, implicitExport: boolean}>(args);

    ['emit', 'emitJS', 'emitWrapper'].forEach(o => {
        options[o] = options[o] == 'true' ? true : options[o] == 'false' ? false : options[o]
    });
    
    log.setLevel(options.logLevel);

    let compiler = new Compiler(options, [
        [`swift`,   [`javascriptcore`]], 
        ['java',    [`nashorn`, 'javascriptcore']],
        [`cs`,      [`chakracore`]], 
        [`php`,     [`v8`]], 
    ]);

    let filename: string|undefined = options._[0];

    if(filename == undefined) {
        log.debug('No filename supplied attempting to read package.json')
        //todo
        return 1;
    } else {
        return compiler.compile(new Module(filename, options.sourceMap, options.implicitExport, options.charset));
        // console.log(JSON.stringify(module, (key, value) => {
        //     return value ? Object.assign(value, { kind: value.constructor.name }) : value;
        // }, 4));       
    }
}

export = main;

if(require.main === module) {
    let [,, ...args] = process.argv;
    process.exit(main(...args));
} else {
    yargs.exitProcess(false);
}