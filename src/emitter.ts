import * as path from 'path';
import {readFileSync} from 'fs';
import {log, Log} from "./log"
import {Module} from "./ast" 
import {writeFileSync} from 'fs';
import {undecorate} from './decorator';

var mkdirp = require('mkdirp');

export interface EmitterOptions {
   emit: boolean|string
   emitJS: boolean|string
   emitWrapper: boolean|string
    //    newLine: 'lf'|'crlf'
    [option: string]: any
}

export class Emitter {
    
    private readonly languages: Map<string, string[]>    
    
    constructor(private readonly options: EmitterOptions, languages: [string, string[]][]) {
        this.languages = new Map(languages);
    }
    
    emit(sourceFile: string, module: Module): number {
        let emittedOutput = false;  
        module.sourcePath = path.parse(sourceFile); 
        module.name = module.sourcePath.name;
        for(const [language, engines] of this.languages) {
            emittedOutput = this.emitLanguage(module, language, engines) || emittedOutput;            
        }
        if(!emittedOutput) {
            log.error(`No output languages specified use --${[...this.languages.keys()].join(' or --')}`);
            log.info(`You need to specify at least one language to generate source for`);
        }       
        return log.errorCount;
    }

    private emitLanguage(module: Module, language: string, engines: string[]): boolean {
        if(this.options[language]) {
            const options = Object.assign({}, this.options, this.options[language]);
            const outDir = typeof options.emit === 'boolean' ? '.' : options.emit;
            let emittedOutput = false;  
            for(const engine of engines) {
                if(options[engine]) {
                    this.emitEngine(module, language, engine, outDir, Object.assign({}, options, options[engine]));
                    emittedOutput = true;
                }
            }
            if(!emittedOutput) {
                this.emitEngine(module, language, engines[0], outDir, options);
            }
            return true;
        }
        return false;
    }
    
    private emitEngine(module: Module, language: string, engine: string, outDir: string, options: EmitterOptions) {
        const engineOptions = Object.assign({}, options, options[engine])
        log.info(`Emitting ${language} source for ${engine} engine to ${path.relative('.', outDir)}`);
        require(path.join(__dirname, language, engine));
        const writeFile = (filename: string, data: string) => {
            if(!engineOptions.emit) {
                log.info(`Skipping emit of file ${path.relative('.', filename)}`);
            } else {
                log.info(`Emitting file ${path.relative('.', filename)}`);
                mkdirp.sync(path.parse(filename).dir)
                writeFileSync(filename, data);            
            }
        }        
        module.emit(outDir, engineOptions, writeFile);
        if(options.emitWrapper) {
            module.emitWrapper(typeof options.emitWrapper === 'boolean' ? outDir : options.emitWrapper, engineOptions, writeFile);
        }                
        if(options.emitJS) {
            const src = path.join(typeof options.emitJS === 'boolean' ? outDir : options.emitJS, module.sourcePath.base);
            const dest = path.join(module.sourcePath.dir, module.sourcePath.base);
            if(src != dest) {
                writeFile(src, readFileSync(dest, 'utf8'));
            }
        }                
        undecorate();
    }    
}

