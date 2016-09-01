import * as ts from "typescript";
import {log} from "../log"
import {Module, Comment, Declaration, Flags, SourceFile, NamespaceDeclaration, Type} from "../ast"
import {walk, NodeVisitor, VariableDeclaration, FunctionDeclaration} from "./visitor"
import {readFileSync} from 'fs';

function getFlags(node: ts.Node): Flags {
    return (node.flags & ts.NodeFlags.Abstract) ? Flags.Abstract : Flags.None 
        | (node.flags & ts.NodeFlags.Protected) ? Flags.Protected : Flags.None
        | (node.flags & ts.NodeFlags.Static) ? Flags.Static : Flags.None
}

export class Parser implements NodeVisitor<Declaration> {

    private readonly program: ts.Program;
    private readonly symbols: SymbolTable;
    
    constructor(program: ts.Program, implicitExport: boolean) {
        this.program = program;
        this.symbols = new SymbolTable(program, implicitExport);
    }

    parse(sourceRoot: string): Module {
        return new Module(sourceRoot, this.program.getSourceFiles().map(node => walk(node, this)[0] as SourceFile));
    }

    shouldVisit(node: ts.Declaration): boolean {
        if(this.symbols.isExported(node)) return true;
        log.debug(`Skipping unexported ${ts.SyntaxKind[node.kind]}`, node);
        return false;
    }

    visitSourceFile(node: ts.SourceFile): Declaration {
        // console.log(JSON.stringify(ts.createSourceFile(node.fileName, readFileSync(node.fileName).toString(), ts.ScriptTarget.ES6, false), (key, value) => { 
        //     return value ? Object.assign(value, { kind: ts.SyntaxKind[value.kind], flags: ts.NodeFlags[value.flags] }) : value; 
        // }, 4)); 
        return new SourceFile(node.fileName, walk(node, this, false));
    }

    visitNamespace(node: ts.ModuleDeclaration): Declaration {
        const nodes = this.symbols.getDeclarations<ts.ModuleDeclaration>(node, ts.SyntaxKind.ModuleDeclaration);
        return new NamespaceDeclaration(node.name!.text, getFlags(node), 
            nodes.reduce<Declaration[]>((reduced, node) => [...reduced, ...walk(node, this)], []));           
    }
}

class SymbolTable implements NodeVisitor<boolean> {

    private readonly checker: ts.TypeChecker;
    private readonly implicitExport: boolean;
    private readonly symbols = new Set<string>();
    private readonly exports = new Map<ts.Declaration, ReadonlyArray<ts.Declaration>>();
    private readonly thrown = new Set<string>();

    constructor(program: ts.Program, implicitExport: boolean) {
        this.checker = program.getTypeChecker();
        this.implicitExport = implicitExport;
        program.getSourceFiles().forEach(file => walk(file, this));
    } 

    isExported(node: ts.Declaration): boolean {
        return this.exports.has(node);
    }

    getDeclarations<T extends ts.Declaration>(node: ts.Declaration, kind: ts.SyntaxKind): ReadonlyArray<T> {
        return this.exports.get(node)!.filter(node => node.kind & kind) as T[];
    }

    private declarationsFor(declaration: ts.Declaration): ts.Declaration[] {
        if(declaration.name === undefined) return [declaration];
        const symbol = this.checker.getSymbolAtLocation(declaration.name);
        return symbol == undefined ?  [declaration] : symbol.declarations!.filter( d => { 
            switch(declaration.kind) {
                case ts.SyntaxKind.FunctionDeclaration:
                    return d.kind != ts.SyntaxKind.FunctionDeclaration || ((d as ts.FunctionDeclaration).parameters.length == (declaration as ts.FunctionDeclaration).parameters.length &&
                        (d as ts.FunctionDeclaration).parameters.reduce((typesMatch, p, i) => typesMatch && p.type == (declaration as ts.FunctionDeclaration).parameters[i].type, true));
                case ts.SyntaxKind.ModuleDeclaration:
                    return d.kind != ts.SyntaxKind.FunctionDeclaration;
            }
            return true;
        });        
    }

    private isMainDeclaration(node: ts.Node): boolean {
        let declarations = this.declarationsFor(node as ts.Declaration);
        return node === declarations.reduce((main, d) => !main || (main.kind == ts.SyntaxKind.ModuleDeclaration && d.kind != ts.SyntaxKind.ModuleDeclaration) ? d : main);
    }

    // visitNode(node ts.Node): boolean {
    //     return 
    // }

    visitFunction(node: FunctionDeclaration): boolean {
        const comment = new Comment(node);
        comment.tagsNamed('throws').filter(tag => tag.type).forEach(tag => this.thrown.add(tag.type.name!));
        return false;
    }

    visitIdentifier(node: ts.Identifier): boolean {
        const symbol = this.checker.getSymbolAtLocation(node);
        if(!(symbol.flags & ts.SymbolFlags.Export)) return true;
        const name = this.checker.getFullyQualifiedName(symbol);
        if(this.symbols.has(name)) return true;        
        const comment = new Comment(node.parent!);
        this.symbols.add(name);
        const declaration = symbol.getDeclarations().reduce((main, d) => !main || (main.kind == ts.SyntaxKind.ModuleDeclaration && d.kind != ts.SyntaxKind.ModuleDeclaration) ? d : main); 
        this.exports.set(declaration, symbol.getDeclarations());
        //if type reference ensure type is exported
        const type = this.checker.getTypeOfSymbolAtLocation(symbol, node);
        const unexported = !this.symbols.has(this.checker.getFullyQualifiedName(type.getSymbol()));
        if(unexported) type.getSymbol().getDeclarations().forEach((child: ts.Node | undefined) => {
            for(let node = child; node; node = node.parent) {
                node.flags |= ts.NodeFlags.Export;
            }
            walk(node.getSourceFile(), this);
        });
        return false;
    }
}

