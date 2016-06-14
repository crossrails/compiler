import {log} from "./log"
import {Module} from "./ast" 
import {Options} from 'yargs';
import {writeFileSync} from 'fs';

export interface EmitterOptions {
   outDir: string
   exportAll?: boolean
//    newLine: 'lf'|'crlf'
   noEmit?: boolean
   noEmitWrapper?: boolean
}

export abstract class Emitter<T extends EmitterOptions> {
    
    private noEmit: boolean | undefined;
    
    public emit(module: Module, options: T): void {
        this.noEmit = options.noEmit;
        this.emitModule(module, options);
    }
    
    protected writeFile(filename: string, data: string) {
        if(this.noEmit) {
            log.info(`Skipping emit of file ${filename}`);
        } else {
            log.info(`Emitting file ${filename}`);
            writeFileSync(filename, data);            
        }
    }
    
    protected abstract emitModule(module: Module, options: T): void
}