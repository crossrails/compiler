import {Environment as Nunjucks, ILoader as Loader} from 'nunjucks'
import {Module} from "./ast" 

export interface EmitterOptions {
   outDir: string
   newLine: 'lf'|'crlf'
   noEmit: boolean
   noEmitHelpers: boolean
}

export abstract class Emitter<T> {
    
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
        let defaults: EmitterOptions = {
            outDir: '.',
            newLine: 'crlf',
            noEmit: false,
            noEmitHelpers: false        
        }        
        this.writeFiles(this.module, this.nunjucks, Object.assign(defaults, this.defaultOptions, options));
    }

    protected abstract get defaultOptions(): T;
    
    protected abstract get loader(): Loader;
    
    protected abstract addFilters(nunjucks: Nunjucks): void;
    
    protected abstract writeFiles(module: Module, nunjucks: Nunjucks, options: EmitterOptions & T): void;
}