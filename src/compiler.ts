import {log} from "./log"
import {Module} from "./ast" 
import * as ast from "./ast" 
import {Emitter, EmitterOptions} from "./emitter" 

export interface CompilerOptions {
   [option :string] :CompilerOptions
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
            return 1;
        }       
        return 0;
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
    
    protected loadEmitter<T>(language: string, engine: string): Emitter<T> {
        return require(`./${language}/${engine}`).default;        
    }
    
    private emit<T extends EmitterOptions>(module: Module, language: string, engine: string, options: T & CompilerOptions) {
        let engineOptions = Object.assign({}, options, options[engine])
        let emitter: Emitter<T> = this.loadEmitter(language, engine);
        log.info(`Emitting source for engine ${engine} to ${engineOptions.outDir}`);
        emitter.emit(module, engineOptions);                        
    }
}