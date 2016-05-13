import {Environment as Nunjucks, FileSystemLoader} from 'nunjucks'
import log from "./log"
import * as ast from "./ast" 
import {writeFile} from 'fs';

let filename: string|undefined = process.argv[2];

if(filename == undefined) {
    log.debug('No filename supplied attempting to read package.json')
} else {
    let module = new ast.Module(filename);
    // console.log(JSON.stringify(module, (key, value) => {
    //     return value ? Object.assign(value, { kind: value.constructor.name }) : value;
    // }, 4));   
    // let transpiler = new Transpiler(require("./languages/swift"), require("./engines/swift/javascriptcore"));
    // transpiler.transpile(module);
    var nunjucks = new Nunjucks(new FileSystemLoader('src/swift'), { 
        autoescape: false, 
        // throwOnUndefined: true,
        tags: {
            blockStart: '<%',
            blockEnd: '%>',
            variableStart: '<$',
            variableEnd: '$>',
            commentStart: '<#',
            commentEnd: '#>'
        }
    });
    
    nunjucks.addFilter('indent', (text: string, direction: number) => {
        let indent = /^( *)\S/m.exec(text)![1].length;
        return text.replace(new RegExp(`^ {${indent}}`, 'gm'), "    ".repeat(indent/4 + direction));
    });
    
    nunjucks.addFilter('array', (iterable: Iterable<any>) => {
        return Array.from(iterable);
    });
    
    nunjucks.addFilter('kind', (object: any) => {
        return object.constructor.name;
    });
    
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
    
    require("./swift/javascriptcore");
    for(let file of module.files as Array<ast.SourceFile>) {
        writeFile(`${file.filename}.swift`, nunjucks.render('javascriptcore.njk', {
            file: file,
            module: module, 
        }));
    }
}
