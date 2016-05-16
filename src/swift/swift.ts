import * as path from 'path';
import {log} from "../log"
import {EmitterOptions, Emitter} from "../emitter" 
import {Environment as Nunjucks, FileSystemLoader} from 'nunjucks'
import * as ast from "../ast" 
import {writeFile} from 'fs';
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
    
    protected addFilters(nunjucks: Nunjucks): void {
        nunjucks.addFilter('keyword', (variable: ast.VariableDeclaration) => {
            return variable.constant ? 'let' : 'var';
        });        
        nunjucks.addFilter('signature', (type: ast.Type) => {
            return type.accept({
                visitAnyType(node: ast.AnyType): string {
                    return 'Any';
                },
                visitStringType(node: ast.StringType): string {
                    return 'String'
                },            
                visitNumberType(node: ast.NumberType): string {
                    return 'Double'
                },            
                visitBooleanType(node: ast.BooleanType): string {
                    return 'Bool'
                },
                visitArrayType(node: ast.ArrayType): string {
                    return `[${node.typeArguments[0].accept(this)}]`;        
                }
            }) + (type.optional ? '?' : '')
        });        
    }
    
    protected writeFiles(module: ast.Module, nunjucks: Nunjucks, engine: string, options: SwiftEmitterOptions): void {
        let writtenModuleFile = false;  
        for(let file of module.files as Array<ast.SourceFile>) {
            writtenModuleFile = writtenModuleFile || module.name == file.path.name;
            let filename = path.join(options.outDir, path.relative('.', file.path.dir), module.name);
            writeFile(`${filename}.swift`, nunjucks.render(`${engine}.njk`, {
                file: file,
                module: module, 
                bundleId: options.bundleId
            }));
        }        
        if(!writtenModuleFile) {
            writeFile(`${path.join(options.outDir, module.name)}.swift`, nunjucks.render(`${engine}.njk`, {
                module: module, 
                bundleId: options.bundleId
            }));            
        }
    }
}