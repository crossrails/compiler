import * as assert from 'assert';
import * as ts from "typescript";
import {log} from "../log"
import {Module, Comment, Declaration, Flags, SourceFile, NamespaceDeclaration, ClassDeclaration, Type} from "../ast"
import {visitNode, visitNodes, NodeVisitor, VariableDeclaration, FunctionDeclaration} from "./visitor"

export class SymbolTable implements NodeVisitor<boolean|void> {

    private readonly checker: ts.TypeChecker;
    private readonly implicitExport: boolean;
    private readonly symbols = new Set<string>();
    private readonly exports = new Map<ts.Declaration, ReadonlyArray<ts.Declaration>>();
    private readonly thrown = new Set<string>();

    constructor(program: ts.Program, implicitExport: boolean) {
        this.checker = program.getTypeChecker();
        this.implicitExport = implicitExport;
        visitNodes(program.getSourceFiles().filter(f => !f.hasNoDefaultLib), this, true);
    } 

    isExported(node: ts.Declaration): boolean {
        return this.exports.has(node);
    }

    getExports(node: ts.Declaration): ReadonlyArray<ts.Declaration> {
        assert(this.isExported(node));
        return this.exports.get(node) || [];
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

    visitSourceFile(node: ts.SourceFile) {
        this.exports.set(node, [node]);
    }

    visitFunction(node: FunctionDeclaration) {
        const comment = new Comment(node);
        comment.tagsNamed('throws').filter(tag => tag.type).forEach(tag => this.thrown.add(tag.type.name!));
    }

    visitIdentifier(node: ts.Identifier): boolean|void {
        const symbol = this.checker.getSymbolAtLocation(node);
        if(!(this.implicitExport || symbol.flags & ts.SymbolFlags.Export)) return true;
        const name = this.checker.getFullyQualifiedName(symbol);
        if(this.symbols.has(name)) return true;        
        const comment = new Comment(node.parent!);
        this.symbols.add(name);
        log.debug(`Parsed symbol ${name}`, node);
        const declaration = symbol.getDeclarations().reduce((main, d) => !main || (main.kind == ts.SyntaxKind.ModuleDeclaration && d.kind != ts.SyntaxKind.ModuleDeclaration) ? d : main); 
        this.exports.set(declaration, symbol.getDeclarations());
        //if type reference ensure type is exported
        const type = this.checker.getTypeOfSymbolAtLocation(symbol, node);
        if(!type.symbol || this.symbols.has(this.checker.getFullyQualifiedName(type.symbol))) return; 
        type.getSymbol().getDeclarations().forEach((child: ts.Node | undefined) => {
            for(let node = child; node; node = node.parent) {
                node.flags |= ts.NodeFlags.Export;
            }
            visitNode(node.getSourceFile(), this, true);
        });
    }
}

