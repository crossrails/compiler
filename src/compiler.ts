import {log} from "./log"
import {Module} from "./ast" 
import {writeFileSync} from 'fs';

export interface CompilerOptions {
   outDir: string
   exportAll?: boolean
//    newLine: 'lf'|'crlf'
   noEmit?: boolean
   noEmitWrapper?: boolean
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
        }       
        console.log(`Compilation ${log.errorCount ? 'failed' : 'suceeded' } with ${log.errorCount} error${log.errorCount == 1 ? '' : 's'} and ${log.warningCount} warning${log.errorCount == 1 ? '' : 's'}`)
        return log.errorCount;
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
    
    private emit(module: Module, language: string, engine: string, options: CompilerOptions) {
        let engineOptions = Object.assign({}, options, options[engine])
        log.info(`Emitting ${language} source for ${engine} engine to ${engineOptions.outDir}`);
        require(`./${language}/${engine}`);        
        module.emit(engineOptions, (filename, data) => {
            if(engineOptions.noEmit) {
                log.info(`Skipping emit of file ${filename}`);
            } else {
                log.info(`Emitting file ${filename}`);
                writeFileSync(filename, data);            
            }
        });
    }
}

declare module "./ast" {

    interface Module {
        emit(options: CompilerOptions, writeFile: (filename: string, data: string) => void): void
    }

    interface Declaration {
        emit(): string
        declarationName(): string
    }

    interface TypeDeclaration {
        typeName(): string
        emit(isGlobalType?: boolean): string
        keyword(): string
        imports(isGlobalType?: boolean): string
        header(isGlobalType?: boolean): string
        footer(): string
        heritage(): string
    }

    interface FunctionDeclaration {
        body(): string
    }

    interface VariableDeclaration {
        getter(): string
        setter(): string
    }

    interface Type {
        typeName(): string;
        typeSignature(optional?: boolean): string;
    }
    
}