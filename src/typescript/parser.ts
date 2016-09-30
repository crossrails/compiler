import * as path from 'path';
import * as ts from "typescript";
import * as ast from "../ast"
import {log} from "../log"
import {Comment} from "../comment"
import {SymbolTable} from './symboltable'
import {visitNode, visitNodes, ancestry, NodeVisitor, VariableDeclaration, BreakVisitException, ContinueVisitException} from "./visitor"

function getFlags(node: ts.Node): ast.Flags {
    const comment = Comment.fromNode(node);
    const isAbstract = (node.flags & ts.NodeFlags.Abstract) || comment.isTagged('abstract') || comment.isTagged('virtual') || [...ancestry(node)].some(n => n.kind == ts.SyntaxKind.InterfaceDeclaration); 
    const isProtected = (node.flags & ts.NodeFlags.Protected) || comment.isTagged('protected') || comment.isTagged('access', 'protected');
    const isStatic = (node.flags & ts.NodeFlags.Static) || comment.isTagged('static') || [...ancestry(node)].every(n => n.kind != ts.SyntaxKind.InterfaceDeclaration && n.kind != ts.SyntaxKind.ClassDeclaration);
    return (isAbstract ? ast.Flags.Abstract : ast.Flags.None) | (isProtected ? ast.Flags.Protected : ast.Flags.None) | (isStatic ? ast.Flags.Static : ast.Flags.None);
}

export class TypeScriptParser implements NodeVisitor<ast.Declaration> {

    private readonly program: ts.Program
    private readonly symbols: SymbolTable
    private readonly sourceRoot: string
    
    constructor(sourceMap: {sourceRoot: string, sources: string[]}, includes: (path: String, exclude?: (index: number) => void) => boolean, implicitExport: boolean, lib: string[] | undefined, charset: string) {
        this.program = ts.createProgram(sourceMap.sources.map(s => path.join(sourceMap.sourceRoot, s)), {allowJs: true, strictNullChecks: true, skipDefaultLibCheck: true, charset: charset, lib: lib});
        this.symbols = new SymbolTable(this.program, includes, implicitExport);
        this.sourceRoot = sourceMap.sourceRoot;
    }

    parse(): ast.Module {
        log.logDiagnostics(ts.getPreEmitDiagnostics(this.program));
        return new ast.Module(this.sourceRoot, visitNodes(this.program.getSourceFiles().filter(f => !f.hasNoDefaultLib), this, true) as ast.SourceFile[]);
    }

    shouldVisitNode(node: ts.Declaration): boolean {
        if(this.symbols.isExported(node)) return this.symbols.getExports(node).length > 0;
        const root = !node.parent || node.parent.kind == ts.SyntaxKind.SourceFile || node.parent.kind == ts.SyntaxKind.ModuleBlock;
        log.debug(`Skipping ${root ? 'unexported' : 'private'} ${ts.SyntaxKind[node.kind]} ${this.symbols.getName(node)}`, node);
        return false;
    }

    visitSourceFile(node: ts.SourceFile): ast.Declaration {
        // console.log(JSON.stringify(ts.createSourceFile(node.fileName, readFileSync(node.fileName).toString(), ts.ScriptTarget.ES6, false), (key, value) => { 
        //     return value ? Object.assign(value, { kind: ts.SyntaxKind[value.kind], flags: ts.NodeFlags[value.flags] }) : value; 
        // }, 4)); 
        const declarations = visitNode(node, this, false);
        if(declarations.length == 0) {
            log.info(`No exported declarations found in ${path.relative('.', node.fileName)}`);            
            throw BreakVisitException;            
        }
        return new ast.SourceFile(node.fileName, declarations);
    }

    visitNamespace(node: ts.ModuleDeclaration): ast.Declaration {
        return new ast.NamespaceDeclaration(node.name!.text, getFlags(node), visitNodes(this.symbols.getExports(node), this, false));           
    }

    visitClass(node: ts.ClassDeclaration): ast.Declaration {
        const flags = getFlags(node) | (this.symbols.isThrown(node) ? ast.Flags.Thrown : ast.Flags.None);
        const typeParameters = node.typeParameters ? node.typeParameters.map(t => this.symbols.getType(t)) : [];
        return new ast.ClassDeclaration(node.name!.text, flags, visitNodes(this.symbols.getExports(node), this, false), typeParameters);           
    }

    visitInterface(node: ts.InterfaceDeclaration): ast.Declaration {
        const typeParameters = node.typeParameters ? node.typeParameters.map(t => this.symbols.getType(t)) : []; 
        return new ast.InterfaceDeclaration(node.name!.text, getFlags(node), visitNodes(this.symbols.getExports(node), this, false), typeParameters);           
    }

    visitConstructor(node: ts.ConstructorDeclaration): ast.Declaration {
        const typeParameters = node.typeParameters ? node.typeParameters.map(t => this.symbols.getType(t)) : []; 
        return new ast.ConstructorDeclaration(getFlags(node), this.symbols.getSignature(node), typeParameters);
    }

    visitFunction(node: ts.SignatureDeclaration): ast.Declaration {
        const typeParameters = node.typeParameters ? node.typeParameters.map(t => this.symbols.getType(t)) : []; 
        return new ast.FunctionDeclaration((node.name as ts.Identifier).text, getFlags(node), this.symbols.getSignature(node), typeParameters);
    }

    visitVariable(node: VariableDeclaration): ast.Declaration {
        const flags = getFlags(node) | (node.parent && (node.parent.flags & ts.NodeFlags.Const) != 0 ? ast.Flags.Constant : ast.Flags.None);
        return new ast.VariableDeclaration((node.name as ts.Identifier).text, flags, this.symbols.getType(node));
    }

    visitOtherNode(node: ts.Node): ast.Declaration {
        throw ContinueVisitException;
    }

    visitUnsupportedNode(node: ts.Node): void {
        log.warn(`Skipping ${ts.SyntaxKind[node.kind]} ${this.symbols.getName(node)}`, node); 
        log.info(`This syntax element is not currently supported by crossrails`);
    }
}

