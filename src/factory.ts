import * as ts from "typescript";
import {walk, NodeVisitor, VariableDeclaration, FunctionDeclaration} from "./visitor"
import {Factory, Comment, Declaration, SourceFile, NamespaceDeclaration} from "./ast"

export function createFactory(program: ts.Program, implicitExport: boolean): Factory {
    const table = new SymbolTable(program, implicitExport);
    const factory = (node: ts.Node, parent: Declaration|SourceFile) => walk(node, {
        shouldVisit(node: ts.Declaration): boolean {
            return table.isExported(node);
        },
        visitNamespace(node: ts.ModuleDeclaration) {
            return new NamespaceDeclaration(node, parent, factory);           
        }
    }, false);
    return factory;
}

class SymbolTable implements NodeVisitor<boolean> {

    private readonly checker: ts.TypeChecker;
    private readonly implicitExport: boolean;
    private readonly symbols = new Set<string>();
    private readonly exports = new Set<ts.Declaration>();
    private readonly thrown = new Set<string>();

    constructor(program: ts.Program, implicitExport: boolean) {
        this.checker = program.getTypeChecker();
        this.implicitExport = implicitExport;
        program.getSourceFiles().forEach(file => walk(file, this));
    } 

    isExported(node: ts.Declaration): boolean {
        return this.exports.has(node);
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
        this.exports.add(symbol.getDeclarations().reduce((main, d) => !main || (main.kind == ts.SyntaxKind.ModuleDeclaration && d.kind != ts.SyntaxKind.ModuleDeclaration) ? d : main));
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

