import log from "./log"
import {WriteStream} from 'fs';
import {Module, SourceFile, Declaration, VariableDeclaration, ClassDeclaration, MethodDeclaration, DeclarationVisitor} from "./ast" 

export interface Output {
    emit(file: string, output: string): void;
    emitChildren(): void;
}

export interface Emitter {
    emitModule(node: Module, out: Output): void;
    emitSourceFile(node: SourceFile, out: Output): void;
    emitVariable(node: VariableDeclaration, out: Output): void;
    emitClass(node: ClassDeclaration, out: Output): void;
    emitMethod(node: MethodDeclaration, out: Output): void;    
}

type NodeEmitter<T> = (node: T, out: Output) => void;

export class Transpiler implements DeclarationVisitor {
    private readonly language: Emitter;
    private readonly engine: Emitter;
    private readonly files: { [index: string]: string};
    
    constructor(language: Emitter, engine: Emitter) {
        this.language = language;
        this.engine = engine;
        this.files = {};
    }

    transpile(module: Module) {
        this.emitNode(module, this.language.emitModule, this.engine.emitModule , () => {
            for(let file of module.files as Array<SourceFile>) {
                this.emitNode(file, this.language.emitSourceFile, this.engine.emitSourceFile, () => {
                    for(let declaration of file.declarations as Array<Declaration>) {
                        declaration.accept(this);
                    }                
                })
            }
        });    
        for(let file in this.files) {
            console.log(`FILE ${file}:`);
            console.log(this.files[file]);
        }    
    }    

    visitVariable(node: VariableDeclaration) {
        this.emitNode(node, this.language.emitVariable, this.engine.emitVariable);
    }
    
    visitClass(node: ClassDeclaration) {
        this.emitNode(node, this.language.emitClass, this.engine.emitClass);                            
    }
    
    visitMethod(node: MethodDeclaration) {
        this.emitNode(node, this.language.emitMethod, this.engine.emitMethod);
    }

    private emitNode<T>(node: T, emitInterface: NodeEmitter<T>, emitImplementation: NodeEmitter<T>, emitChildren: () => void = () => {}) {
        let files = this.files;
        emitInterface(node, {
            emitChildren() {
                let emitter = this.emit;
                emitImplementation(node, {
                    emitChildren: emitChildren, 
                    emit: emitter 
                });
            }, 
            emit(file: string, output: string) {
                let contents = files[file];
                files[file] = contents == undefined ? output : contents + output;            
            } 
        });
    }        
}
