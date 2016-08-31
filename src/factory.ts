import * as ts from "typescript";
import {log} from "./log"
import {walk, NodeVisitor, VariableDeclaration, FunctionDeclaration} from "./visitor"
import {Factory as AbstractFactory, Comment, Declaration, SourceFile, NamespaceDeclaration, Type} from "./ast"

export class Factory implements AbstractFactory {

    private readonly symbols: SymbolTable;
    
    constructor(program: ts.Program, implicitExport: boolean) {
        this.symbols = new SymbolTable(program, implicitExport);
    }

    createChildren<T extends Declaration>(node: ts.Node, parent: Declaration|SourceFile): T[] {
        return walk<Declaration>(node, {
            shouldVisit(this: Factory, node: ts.Declaration): boolean {
                if(this.symbols.isExported(node)) return true;
                log.debug(`Skipping unexported ${ts.SyntaxKind[node.kind]}`, node);
                return false;
            },
            visitNamespace(this: Factory, node: ts.ModuleDeclaration) {
                const nodes = this.symbols.getDeclarations<ts.ModuleDeclaration>(node, ts.SyntaxKind.ModuleDeclaration);
                return new NamespaceDeclaration(nodes, parent, this);           
            }
        }, false, this) as T[];
    }

    createType<T extends Type>(node: ts.Node, parent: Declaration|SourceFile): T {

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

