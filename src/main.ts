#!/usr/bin/env node

import * as path from 'path';
import {log} from "./log"
import {Module} from "./ast"
import {TypeScriptParser} from "./typescript/parser"
import {readFileSync, accessSync, R_OK} from 'fs';
import {Emitter, EmitterOptions} from "./emitter"

import yargs = require('yargs');

interface ParserFactory {
    new(sourceMap: {sourceRoot: string, sources: string[]}, implicitExport: boolean, charset: string): {parse(): Module};
}

function main(...args: string[]): number {

    const options = yargs
        .usage('Usage: $0 [file.js|package.json|bower.json] [options]')
        .check((argv: yargs.Argv, aliases: { [key: string]: string[] }) => {
            const filename = argv._[0] && path.basename(argv._[0]);
            return !filename || filename.endsWith('.js') || filename == 'package.json' || filename == 'bower.json' ? true : 'File argument must be a javascript source file (.js) or package manifest file (bower.json|package.json)';
        })
        .example('$0 src.min.js --swift', 'Compile to swift, outputting beside original source files')
        .example('$0 src.js --java.emit java', 'Compile to java, outputting to a java subdirectory')
        .alias('v', 'version').version()
        .help('h').alias('h', 'help')
        .group(['p', 'l', 'h', 'v', 'charset', 'sourceMap', 'declarationFile', 'implicitExport'], 'Global options:')
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
                desc: 'Compile source to use the JavaScriptCore engine under the hood [default engine]',
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
        .parse<EmitterOptions & {sourceMap?: string, declarationFile?: string, typings?: string, logLevel: string, charset: string, implicitExport: boolean}>(args);

    ['emit', 'emitJS', 'emitWrapper'].forEach(o => {
        options[o] = options[o] == 'true' ? true : options[o] == 'false' ? false : options[o]
    });
    
    log.setLevel(options.logLevel);

    const emitter = new Emitter(options, [
        [`swift`,   [`javascriptcore`]], 
        ['java',    [`nashorn`, 'j2v8']],
        [`c#`,      [`chakracore`]], 
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
        const sourceMap = mapSources(filename, options.sourceMap, options.declarationFile, options.typings, options.charset);
        const factory: ParserFactory = TypeScriptParser;
        const parser = new factory(sourceMap, options.implicitExport, options.charset);
        // console.log(JSON.stringify(module, (key, value) => {
        //     return value ? Object.assign(value, { kind: value.constructor.name }) : value;
        // }, 4));
        const module = parser.parse();
        if(module.files.length) {
            emitter.emit(filename, module); 
        } else if(log.errorCount == 0) {
            log.warn(`Nothing to output as no exported declarations found in the source files`);                
            log.info(`Resolve this warning by prefixing your declarations with the export keyword or a @export jsdoc tag or use the --implicitExport option`)
        }
    }
    
    return log.errorCount;
}

function mapSources(src: string, sourceMapFile: string|undefined, declarationFile: string|undefined, typings: string|undefined, charset: string) : {sourceRoot: string, sources: string[]} {
    if(sourceMapFile || !declarationFile) try {                
        const sourceMap = sourceMapFile || `${src}.map`;
        log.debug(`Attempting to open sourcemap at ${path.relative('.', sourceMap)}`);
        const map = JSON.parse(readFileSync(sourceMap, charset));
        map.sourceRoot = path.join(path.dirname(src), map.sourceRoot); 
        log.debug(`Sourcemap found with ${map.sources.length} source(s)`);
        return map;
    } catch(error) {
        if(sourceMapFile || error.code != 'ENOENT') {
            throw error;
        }
        log.info(`No sourcemap found`);
    }
    try {
        const file = declarationFile || typings || `${src.slice(0, -3)}.d.ts`;
        log.debug(`Attempting to open declaration file (.d.ts) at ${path.relative('.', file)}`);
        accessSync(file, R_OK);
        log.debug(`Declaration file (.d.ts) found`);
        return  {sourceRoot: path.dirname(file), sources: [path.basename(file)] }; 
    } catch(error) {
        if(declarationFile || error.code != 'ENOENT') {
            throw error;
        }
        log.info(`No declaration file (.d.ts) file found`);
    }
    return { sourceRoot: path.dirname(src), sources: [path.basename(src)] }; 
} 
    
function readPackageFile(filename: string, options: {typings?: string, charset: string}): string|undefined {
    try {
        log.debug(`Attempting to open package manifest file at ${path.relative('.', filename)}`);
        const json = JSON.parse(readFileSync(filename, options.charset));
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
    const [,, ...args] = process.argv;
    process.exit(main(...args));
} else {
    yargs.exitProcess(false);
}

