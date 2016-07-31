#!/usr/bin/env node

import * as path from 'path';
import {log} from "./log"
import {Module} from "./ast"
import {readFileSync} from 'fs';
import {Compiler, CompilerOptions} from "./compiler"

import yargs = require('yargs');

function main(...args: string[]): number {

    let options = yargs
        .usage('Usage: $0 [file.js|package.json|bower.json] [options]')
        .check((argv: yargs.Argv, aliases: { [key: string]: string[] }) => {
            let filename = argv._[0] && path.basename(argv._[0]);
            return !filename || filename.endsWith('.js') || filename == 'package.json' || filename == 'bower.json' ? true : 'File argument must be a javascript source file (.js) or package manifest file (bower.json|package.json)';
        })
        .example('$0 src.min.js --swift', 'Compile to swift, outputting beside original source files')
        .example('$0 src.js --java.emit java', 'Compile to java, outputting to a java subdirectory')
        .alias('v', 'version').version()
        .help('h').alias('h', 'help')
        .group(['p', 'l', 'h', 'v', 'charset', 'sourceMap', 'implicitExport'], 'Global options:')
        .option('p', {
            config: true,
            alias: 'project',
            describe: 'Path to a xrails.json project config file (or to a directory containing one)',
            type: 'string'
        })
        .option('sourceMap', {
            describe: 'Path to the source map of the input file, defaults to [file.js].map',
            type: 'string'
        })
        .option('declarationFile', {
            describe: 'Path to a typescript declaration file (.d.ts), defaults to [file.js].d.ts',
            type: 'string'
        })
        .option('charset', {
            default: 'utf8',
            describe: 'The character set of the input files',
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
                desc: 'Compile source to swift (enabled automatically if any swift option specified e.g. swift.emit=gen)' 
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
                desc: 'Prefix all function arguments with _ [boolean] [default: false]',
            }
        })
        .options({
            'java': { 
                group: 'Java options:',
                desc: 'Compile source to java (enabled automatically if any java option specified e.g. java.emit=gen)' 
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
                desc: 'Emit compiled output, defaults to beside the input files, specify a path to override location [boolean]',
                default: true             
            },
            'emitJS': { 
                group: 'General options:',
                desc: 'Copy the input JS file into the compiled output, specify a path to override default location [boolean]',
                default: true             
            },
            'emitWrapper': { 
                group: 'General options:',
                desc: 'Copy the JS engine wrapper into the compiled output, specify a path to override default location [boolean]',
                default: true             
            }
        })
        .epilog('General options can be applied globally or to any language or engine, e.g. swift.emit or swift.javascriptcore.emit')
        .parse<CompilerOptions & {sourceMap?: string, declarationFile?: string, typings?: string, logLevel: string, charset: string, implicitExport: boolean}>(args);

    ['emit', 'emitJS', 'emitWrapper'].forEach(o => {
        options[o] = options[o] == 'true' ? true : options[o] == 'false' ? false : options[o]
    });
    
    log.setLevel(options.logLevel);

    let compiler = new Compiler(options, [
        [`swift`,   [`javascriptcore`]], 
        ['java',    [`nashorn`, 'j2v8']],
        [`cs`,      [`chakracore`]], 
        [`php`,     [`v8`]], 
    ]);

    let filename: string|undefined = options._[0];

    if(!filename || filename.endsWith('package.json')) {
        filename = readPackageFile(filename || `package.json`, options);
    }
    if(!filename || filename.endsWith('bower.json')) {
        filename = readPackageFile(filename || `bower.json`, options);
    }
    if(!filename) {
        log.error(`No file argument specified and no package manifest file found`)
        log.info(`Specify a JS source file or run again from the same directory as your bower or package json (containing a main attribute)`)
    } else {
        let module = new Module(filename, options.sourceMap, options.declarationFile, options.typings, options.implicitExport, options.charset);
        // console.log(JSON.stringify(module, (key, value) => {
        //     return value ? Object.assign(value, { kind: value.constructor.name }) : value;
        // }, 4));
        if(log.errorCount === 0) {       
            compiler.compile(module); 
        }       
    }
    
    return log.errorCount;
}

function readPackageFile(filename: string, options: {typings?: string, charset: string}): string|undefined {
    try {
        log.debug(`Attempting to open package manifest file at ${path.relative('.', filename)}`);
        let json = JSON.parse(readFileSync(filename, options.charset));
        if(json.typings) {
            options.typings = path.join(path.dirname(filename), json.typings); 
        }
        log.debug(`Using main source file ${path.relative('.', json.main)} specified in manifest file`);
        return path.join(path.dirname(filename), json.main);
    } catch(error) {
        if(error.code != 'ENOENT') {
            throw error;
        }
        return undefined;
    }
}

export = main;

if(require.main === module) {
    let [,, ...args] = process.argv;
    process.exit(main(...args));
} else {
    yargs.exitProcess(false);
}

