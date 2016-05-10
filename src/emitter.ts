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

export type NodeEmitter<T> = (node: T, out: Output) => void;

export function emitNode<T>(node: T, emitInterface: NodeEmitter<T>, emitImplementation: NodeEmitter<T>, emitChildren?: () => void) {
    emitInterface(node, {
        emitChildren() {
            let emitter = this.emit;
            emitImplementation(node, {
                emitChildren: emitChildren, 
                emit: emitter 
            });
        }, 
        emit(file: string, output: string) {
            console.log(`${output} >> ${file}`);            
        } 
    });
}


