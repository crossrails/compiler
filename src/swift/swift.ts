import * as path from 'path';
import {log} from "../log"
import {EmitterOptions, Emitter} from "../emitter" 
import {Environment as Nunjucks, FileSystemLoader} from 'nunjucks'
import * as ast from "../ast" 
import {Options} from 'yargs';

export interface SwiftEmitterOptions extends EmitterOptions {
    javascriptcore?: EmitterOptions 
    bundleId: string | undefined    
}

export class SwiftEmitter extends Emitter<SwiftEmitterOptions> {
    
    static readonly options :{ [option :string] :Options} = { 
        'swift': { 
            group: 'Swift options:',
            desc: 'Compile source to swift (enabled automatically if any swift option specified e.g. swift.outDir=gen)' 
        },
        'swift.javascriptcore': { 
            group: 'Swift options:',
            desc: 'Compile source to use the JavaScriptCore engine under the hood [default]',
        },
        'swift.bundleId': { 
            group: 'Swift options:',
            desc: 'The id of the bundle containing the javascript source file, omit to use the main bundle',
            type: 'string'             
        }
    }
    
    protected get engines(): ReadonlyArray<string> {
        return ['javascriptcore'];
    }
    
    protected get loader(): FileSystemLoader {
        return new FileSystemLoader(__dirname);
    }
    
    protected writeFiles(module: ast.Module, nunjucks: Nunjucks, engine: string, options: SwiftEmitterOptions): void {
        let writtenModuleFile = false;  
        for(let file of module.files as Array<ast.SourceFile>) {
            writtenModuleFile = writtenModuleFile || module.name == file.path.name;
            let filename = path.join(options.outDir, path.relative('.', file.path.dir), file.path.name);
            this.writeFile(`${filename}.swift`, nunjucks.render(`${engine}.njk`, {
                file: file,
                module: module, 
                bundleId: options.bundleId
            }));
        }        
        if(!writtenModuleFile) {
            let filename = path.join(options.outDir, module.name);
            this.writeFile(`${filename}.swift`, nunjucks.render(`${engine}.njk`, {
                module: module, 
                bundleId: options.bundleId
            }));            
        }
    }
}