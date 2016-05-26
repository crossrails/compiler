import {log} from "./log"
import {Module} from "./ast" 
import {Emitter, EmitterOptions} from "./emitter" 

export interface CompilerOptions {
   [option :string] :CompilerOptions
}

export class Compiler {
    constructor(private readonly options: CompilerOptions, private readonly languages: Map<string, string[]>) {}
    
    compile(module: Module) {
        let emittedOutput = false;  
        for(let [language, engines] of this.languages) {
            emittedOutput = this.emitLanguage(module, language, engines) || emittedOutput;            
        }
        if(!emittedOutput) {
            log.error(`No output languages specified use --${[...this.languages.keys()].join(' or --')}`);
        }       
    }
    
    private emitLanguage(module: Module, language: string, engines: string[]): boolean {
        if(this.options[language]) {
            let options = Object.assign({}, this.options, this.options[language]);
            let emittedOutput = false;  
            for(let engine of engines) {
                if(options[engine]) {
                    this.emit(module, language, engine, options);
                    emittedOutput = true;
                }
            }
            if(!emittedOutput) {
                this.emit(module, language, engines[0], options);
            }
            return true;
        }
        return false;
    }
    
    private emit<T extends EmitterOptions>(module: Module, language: string, engine: string, options: T & { [option :string] :T}) {
        let engineOptions = Object.assign({}, options, options[engine])
        let emitter: Emitter<T> = require(`./${language}/${engine}`).default;
        log.info(`Emitting source for engine ${engine} to ${engineOptions.outDir}`);
        emitter.emit(module, engineOptions);                        
    }
}