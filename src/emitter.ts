import {log} from "./log"
import {Environment as Nunjucks, ILoader as Loader} from 'nunjucks'
import {Module} from "./ast" 
import {Options} from 'yargs';
import {writeFile} from 'fs';

export interface EmitterOptions {
   outDir: string
//    newLine: 'lf'|'crlf'
   noEmit: boolean
   noEmitWrapper: boolean
}

export abstract class Emitter<T extends EmitterOptions> {
    
    static readonly options :{ [option :string] :Options} = { 
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
    }
    
    private readonly module: Module;
    private readonly nunjucks: Nunjucks;
    
    constructor(module: Module) {
        log.debug(`Loading ${this.constructor.name}`);
        this.module = module;
        this.nunjucks = new Nunjucks(this.loader, { 
            autoescape: false, 
            throwOnUndefined: true,
            tags: {
                blockStart: '<%',
                blockEnd: '%>',
                variableStart: '<$',
                variableEnd: '$>',
                commentStart: '<#',
                commentEnd: '#>'
            }
        });        
        this.nunjucks.addFilter('indent', (text: string, direction: number) => {
            let indent = /^( *)\S/m.exec(text)![1].length;
            return text.replace(new RegExp(`^ {${indent}}`, 'gm'), "    ".repeat(indent/4 + direction));
        });        
        this.nunjucks.addFilter('array', (iterable: Iterable<any>) => {
            return Array.from(iterable);
        });       
        this.nunjucks.addFilter('kind', (object: any) => {
            return object.constructor.name;
        });    
    }
    
    public emit(options: T & { [option :string] :Options}) {
        let emittedOutput = false;  
        for(let engine of this.engines as Array<string>) {
            if(options[engine]) {
                emittedOutput = true;
                let engineOptions = Object.assign({}, options, options[engine])
                log.info(`Emitting source for engine ${engine} to ${engineOptions.outDir}`);
                this.writeFiles(this.module, this.nunjucks, engine, engineOptions);
            }
        }
        if(!emittedOutput) {
            log.info(`Emitting source for engine ${this.engines[0]} to ${options.outDir}`);
            this.writeFiles(this.module, this.nunjucks, this.engines[0], options);            
        }
    }
    
    protected writeFile(filename: string, options: EmitterOptions, data: string) {
        if(options.noEmit) {
            log.info(`Skipping emit of file ${filename}`);
        } else {
            log.info(`Emitting file ${filename}`);
            writeFile(`${filename}.swift`, data);            
        }
    }
    
    protected abstract get engines(): ReadonlyArray<string>

    protected abstract get loader(): Loader
        
    protected abstract writeFiles(module: Module, nunjucks: Nunjucks, engine: string, options: T): void
}