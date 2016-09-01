import * as ts from "typescript";
import {log} from "../log"
import {Module, Comment, Declaration, Flags, SourceFile, NamespaceDeclaration, ClassDeclaration, Type} from "../ast"
import {visitNode, visitNodes, NodeVisitor, VariableDeclaration, FunctionDeclaration} from "./visitor"
import {readFileSync} from 'fs';
import {SymbolTable} from './symboltable'

function getFlags(node: ts.Node): Flags {
    return (node.flags & ts.NodeFlags.Abstract) ? Flags.Abstract : Flags.None 
        | (node.flags & ts.NodeFlags.Protected) ? Flags.Protected : Flags.None
        | (node.flags & ts.NodeFlags.Static) ? Flags.Static : Flags.None
}

export class Parser {

    private readonly program: ts.Program;
    private readonly symbols: SymbolTable;
    
    constructor(program: ts.Program, implicitExport: boolean) {
        this.program = program;
        this.symbols = new SymbolTable(program, implicitExport);
    }

    parse(sourceRoot: string): Module {
        return new Module(sourceRoot, visitNodes(this.program.getSourceFiles(), this.createDeclarations, true, this) as SourceFile[]);
    }

    private readonly createDeclarations: NodeVisitor<Declaration> = {

        shouldVisitNode(this: Parser, node: ts.Declaration): boolean {
            if(this.symbols.isExported(node)) return true;
            log.debug(`Skipping unexported ${ts.SyntaxKind[node.kind]}`, node);
            return false;
        },

        visitSourceFile(this: Parser, node: ts.SourceFile): Declaration {
            // console.log(JSON.stringify(ts.createSourceFile(node.fileName, readFileSync(node.fileName).toString(), ts.ScriptTarget.ES6, false), (key, value) => { 
            //     return value ? Object.assign(value, { kind: ts.SyntaxKind[value.kind], flags: ts.NodeFlags[value.flags] }) : value; 
            // }, 4)); 
            return new SourceFile(node.fileName, visitNode(node, this.createDeclarations, false));
        },

        visitNamespace(this: Parser, node: ts.ModuleDeclaration): Declaration {
            return new NamespaceDeclaration(node.name!.text, getFlags(node), visitNodes(this.symbols.getExports(node), this.createDeclarations, false));           
        },

        visitClass(this: Parser, node: ts.ClassDeclaration): Declaration {
            return new ClassDeclaration(node.name!.text, getFlags(node), visitNodes(this.symbols.getExports(node), this.createDeclarations, false), visitNodes(node.typeParameters!, this.createTypes));           
        },
    }

    private readonly createTypes: NodeVisitor<Type> = {

    }
}

