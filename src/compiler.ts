import * as path from 'path';
import {log, Log} from "./log"
import {Module} from "./ast" 
import {writeFileSync} from 'fs';
import {undecorate} from './decorator';

var mkdirp = require('mkdirp');

export interface CompilerOptions {
   emit: boolean|string
   emitJS: boolean|string
   emitWrapper: boolean|string
    //    newLine: 'lf'|'crlf'
    [option: string]: any
}

export class Compiler {
    
    private readonly languages: Map<string, string[]>
    
    constructor(private readonly options: CompilerOptions, languages: [string, string[]][]) {
        this.languages = new Map(languages);
    }
    
    compile(module: Module): number {
        let emittedOutput = false;  
        for(let [language, engines] of this.languages) {
            emittedOutput = this.emitLanguage(module, language, engines) || emittedOutput;            
        }
        if(!emittedOutput) {
            log.error(`No output languages specified use --${[...this.languages.keys()].join(' or --')}`);
            log.info(`You need to specify at least one language to generate source for`);
        }       
        console.log(`Compilation ${log.errorCount ? 'failed' : 'suceeded' } with ${log.errorCount} error${log.errorCount == 1 ? '' : 's'} and ${log.warningCount} warning${log.warningCount == 1 ? '' : 's'}`)
        if((log.level === Log.Level.ERROR || log.level === Log.Level.WARNING) && (log.errorCount || log.warningCount)) {
            console.log(`Run with --logLevel=info to see more details`)            
        }
        return log.errorCount;
    }

    private emitLanguage(module: Module, language: string, engines: string[]): boolean {
        if(this.options[language]) {
            let options = Object.assign({}, this.options, this.options[language]);
            let outDir = typeof options.emit === 'boolean' ? '.' : path.normalize(options.emit);
            let emittedOutput = false;  
            for(let engine of engines) {
                if(options[engine]) {
                    this.emit(module, language, engine, outDir, Object.assign({}, options, options[engine]));
                    emittedOutput = true;
                }
            }
            if(!emittedOutput) {
                this.emit(module, language, engines[0], outDir, options);
            }
            return true;
        }
        return false;
    }
    
    private emit(module: Module, language: string, engine: string, outDir: string, options: CompilerOptions) {
        let engineOptions = Object.assign({}, options, options[engine])
        log.info(`Emitting ${language} source for ${engine} engine to ${outDir}`);
        require(`./${language}/${engine}`);        
        module.emit(outDir, engineOptions, (filename, data) => {
            if(!engineOptions.emit) {
                log.info(`Skipping emit of file ${filename}`);
            } else {
                log.info(`Emitting file ${filename}`);
                mkdirp.sync(path.parse(filename).dir)
                writeFileSync(filename, data);            
            }
        });
        undecorate();
    }    
}

