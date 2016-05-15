import {Environment as Nunjucks, ILoader as Loader} from 'nunjucks'
import {Module} from "./ast" 
import {Options} from 'yargs';

export interface EmitterOptions {
   outDir: string
//    newLine: 'lf'|'crlf'
   noEmit: boolean
   noEmitHelpers: boolean
}

export abstract class Emitter<T> {
    
    static readonly options :{ [option :string] :Options} = { 
        'outDir': { 
            group: 'General options:',
            desc: 'The directory to output the transpiled files to, omit to output beside original source files',
            type: 'string',
            default: '.'             
        },
        'noEmit': { 
            group: 'General options:',
            desc: 'Do not emit outputs',
            type: 'boolean',             
            default: false             
        },
        'noEmitWrapper': { 
            group: 'General options:',
            desc: 'Do not include the wrapper for JS engine in compiled output',
            type: 'boolean',         
            default: false             
        }
    }
    
    private readonly module: Module;
    private readonly nunjucks: Nunjucks;
    
    constructor(module: Module) {
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
        this.addFilters(this.nunjucks);
    }
    
    public emit(options: EmitterOptions & T) {
        this.writeFiles(this.module, this.nunjucks, options);
    }
    
    protected abstract get loader(): Loader;
    
    protected abstract addFilters(nunjucks: Nunjucks): void;
    
    protected abstract writeFiles(module: Module, nunjucks: Nunjucks, options: EmitterOptions & T): void;
}