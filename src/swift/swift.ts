import {EmitterOptions, Emitter} from "../emitter" 
import {Environment as Nunjucks, FileSystemLoader} from 'nunjucks'
import * as ast from "../ast" 
import {writeFile} from 'fs';

export type SwiftOptions = EmitterOptions & SwiftEmitterOptions; 

interface SwiftEmitterOptions {
    engine: 'javascriptcore' 
    bundleId: string | undefined    
}

export class SwiftEmitter extends Emitter<SwiftEmitterOptions> {

    protected get loader(): FileSystemLoader {
        return new FileSystemLoader('src/swift');
    }
    
    protected get defaultOptions(): SwiftEmitterOptions {
        return {
            engine: 'javascriptcore',
            bundleId: undefined 
        }
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
    
    protected writeFiles(module: ast.Module, nunjucks: Nunjucks, options: SwiftOptions): void {
        for(let file of module.files as Array<ast.SourceFile>) {
            writeFile(`${file.filename}.swift`, nunjucks.render(`${options.engine}.njk`, {
                file: file,
                module: module, 
                bundleId: options.bundleId
            }));
        }        
    }
}