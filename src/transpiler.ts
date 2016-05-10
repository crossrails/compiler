import log from "./log"
import {WriteStream} from 'fs';
import {Module, SourceFile, Declaration, VariableDeclaration, ClassDeclaration, MethodDeclaration, DeclarationVisitor} from "./ast" 

export interface Output {
    writeFile(file: string, output: string): void;
    copyFile(source: string, destination: string): void;
    fileExists(file: string): boolean;
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
    private readonly files: Map<string, string>;
    
    constructor(language: Emitter, engine: Emitter) {
        this.language = language;
        this.engine = engine;
        this.files = new Map();
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
        for(let entry of this.files) {
            console.log(`FILE ${entry[0]}:`);
            console.log(entry[1]);
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
        let self = this;
        let implementationEmitted = false;
        let output :Output = {
            fileExists(file: string): boolean {
                return self.files.has(file);
            },
            copyFile(source: string, destination: string) {
                
            },
            writeFile(file: string, output: string) {
                self.files.set(file, !self.files.has(file) ? output : self.files.get(file) + output);            
            },
            emitChildren() {
                let childrenEmitted = false;
                emitImplementation.apply(self.engine, [node, {
                    fileExists: this.fileExists, 
                    copyFile: this.copyFile, 
                    writeFile: this.writeFile, 
                    emitChildren() {
                        emitChildren();
                        childrenEmitted = true;
                    }
                }]);
                if(!childrenEmitted) {
                    emitChildren();
                }
                implementationEmitted = true;
            } 
        }
        emitInterface.apply(self.language, [node, output]);
        if(!implementationEmitted) {
            output.emitChildren();
        }
    }        
}
