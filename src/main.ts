import log from "./log"
import {emitNode, Emitter} from "./emitter" 
import {VariableDeclaration, ClassDeclaration, MethodDeclaration, Module, Declaration, SourceFile} from "./ast" 

let filename: string|undefined = process.argv[2];

if(filename == undefined) {
    log.debug('No filename supplied attempting to read package.json')
} else {
    let module = new Module(filename);
    // console.log(JSON.stringify(module, (key, value) => {
    //     return value ? Object.assign(value, { kind: value.constructor.name }) : value;
    // }, 4));
    emit(module, require("./languages/swift").default, require("./engines/swift/javascriptcore").default);
}

function emit(module: Module, language: Emitter, engine: Emitter) {
    emitNode(module, language.emitModule, engine.emitModule , () => {
        for(let file of module.files as Array<SourceFile>) {
            emitNode(file, language.emitSourceFile, engine.emitSourceFile, () => {
                for(let declaration of file.declarations as Array<Declaration>) {
                    declaration.accept({
                        visitVariable(node: VariableDeclaration) {
                            emitNode(node, language.emitVariable, engine.emitVariable);
                        },
                        visitClass(node: ClassDeclaration) {
                            emitNode(node, language.emitClass, engine.emitClass);                            
                        },
                        visitMethod(node: MethodDeclaration) {
                            emitNode(node, language.emitMethod, engine.emitMethod);
                        }
                    })
                }                
            })
        }
    });    
    
}