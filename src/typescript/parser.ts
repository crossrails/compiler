import * as ts from "typescript";
import * as ast from "../ast"
import {readFileSync} from 'fs';
import {log} from "../log"
import {Comment} from "../comment"
import {SymbolTable} from './symboltable'
import {visitNode, visitNodes, NodeVisitor, VariableDeclaration, FunctionDeclaration, SkipNodeException} from "./visitor"

function* ancestry(node: ts.Node) {
    while(node = node.parent!) yield node;
}

function getFlags(node: ts.Node): ast.Flags {
    const comment = new Comment(node);
    const isAbstract = (node.flags & ts.NodeFlags.Abstract) || comment.isTagged('abstract') || comment.isTagged('virtual') || [...ancestry(node)].some(n => n.kind == ts.SyntaxKind.InterfaceDeclaration); 
    const isProtected = (node.flags & ts.NodeFlags.Protected) || comment.isTagged('protected') || comment.isTagged('access', 'protected');
    const isStatic = (node.flags & ts.NodeFlags.Static) || comment.isTagged('static') || [...ancestry(node)].every(n => n.kind != ts.SyntaxKind.InterfaceDeclaration && n.kind != ts.SyntaxKind.ClassDeclaration);
    return (isAbstract ? ast.Flags.Abstract : ast.Flags.None) | (isProtected ? ast.Flags.Protected : ast.Flags.None) | (isStatic ? ast.Flags.Static : ast.Flags.None);
}

export class Parser {

    private readonly program: ts.Program;
    private readonly symbols: SymbolTable;
    
    constructor(program: ts.Program, implicitExport: boolean) {
        this.program = program;
        this.symbols = new SymbolTable(program, implicitExport);
    }

    parse(sourceRoot: string): ast.Module {
        return new ast.Module(sourceRoot, visitNodes(this.program.getSourceFiles().filter(f => !f.hasNoDefaultLib), this.createDeclarations, true, this) as ast.SourceFile[]);
    }

    private readonly createDeclarations: NodeVisitor<ast.Declaration> = {

        shouldVisitNode(this: Parser, node: ts.Declaration): boolean {
            if(this.symbols.isExported(node)) return true;
            log.debug(`Skipping unexported ${ts.SyntaxKind[node.kind]}`, node);
            return false;
        },

        visitSourceFile(this: Parser, node: ts.SourceFile): ast.Declaration {
            // console.log(JSON.stringify(ts.createSourceFile(node.fileName, readFileSync(node.fileName).toString(), ts.ScriptTarget.ES6, false), (key, value) => { 
            //     return value ? Object.assign(value, { kind: ts.SyntaxKind[value.kind], flags: ts.NodeFlags[value.flags] }) : value; 
            // }, 4)); 
            return new ast.SourceFile(node.fileName, visitNode(node, this.createDeclarations, false, this));
        },

        visitNamespace(this: Parser, node: ts.ModuleDeclaration): ast.Declaration {
            return new ast.NamespaceDeclaration(node.name!.text, getFlags(node), visitNodes(this.symbols.getExports(node), this.createDeclarations, false, this));           
        },

        visitClass(this: Parser, node: ts.ClassDeclaration): ast.Declaration {
            const flags = getFlags(node) | (this.symbols.isThrown(node) ? ast.Flags.Thrown : ast.Flags.None);
            return new ast.ClassDeclaration(node.name!.text, getFlags(node), visitNodes(this.symbols.getExports(node), this.createDeclarations, false, this), visitNodes(node.typeParameters || [], this.createTypes, true, this));           
        },

        visitInterface(this: Parser, node: ts.InterfaceDeclaration): ast.Declaration {
            return new ast.InterfaceDeclaration(node.name!.text, getFlags(node), visitNodes(this.symbols.getExports(node), this.createDeclarations, false, this), visitNodes(node.typeParameters || [], this.createTypes, true, this));           
        },

        visitConstructor(this: Parser, node: ts.ConstructorDeclaration): ast.Declaration {
            const signature = new ast.FunctionSignature(visitNodes(node.parameters, this.createDeclarations, true, this) as ast.ParameterDeclaration[], visitNode(node.type!, this.createTypes, true, this)[0], []);
            return new ast.ConstructorDeclaration(getFlags(node), signature, visitNodes(node.typeParameters || [], this.createTypes, true, this));
        },

        visitFunction(this: Parser, node: FunctionDeclaration): ast.Declaration {
            if(!node.type) {
                log.warn(`Return type information missing for function, assuming void`, node); 
                log.info(`Resolve this warning by adding a typescript type annotation or a @returns jsdoc tag`, node);
            }   
            let type = node.type ? visitNode(node.type, this.createTypes, true, this)[0] : new ast.VoidType();
            const signature = new ast.FunctionSignature(visitNodes(node.parameters, this.createDeclarations, true, this) as ast.ParameterDeclaration[], type, []);
            return new ast.FunctionDeclaration((node.name as ts.Identifier).text, getFlags(node), signature, visitNodes(node.typeParameters || [], this.createTypes, true, this));
        },

        visitVariable(this: Parser, node: VariableDeclaration): ast.Declaration {
            if(!node.type) {
                log.warn(`Type information missing for variable declaration, resorting to Any`, node);  
                log.info(`Resolve this warning by adding a typescript type annotation or a @type jsdoc tag`, node);
            }
            let type = node.type ? visitNode(node.type, this.createTypes, true, this)[0] : new ast.AnyType();
            const flags = getFlags(node) | (node.parent && (node.parent.flags & ts.NodeFlags.Const) != 0 ? ast.Flags.Constant : ast.Flags.None);
            return new ast.VariableDeclaration((node.name as ts.Identifier).text, flags, type);
        },

        visitParameter(this: Parser, node: ts.ParameterDeclaration): ast.Declaration {
            if(!node.type) {
                log.warn(`Type information missing for function parameter, resorting to Any`, node); 
                log.info(`Resolve this warning by adding a typescript type annotation or a @param jsdoc tag`, node) 
            }   
            let type = node.type ? visitNode(node.type, this.createTypes, true, this)[0] : new ast.AnyType();
            return new ast.ParameterDeclaration((node.name as ts.Identifier).text, getFlags(node), visitNode(node.type!, this.createTypes, true, this)[0]);
        },

        visitOtherNode(this: Parser, node: ts.Node): ast.Declaration {
            const name = this.program.getTypeChecker().symbolToString(this.program.getTypeChecker().getSymbolAtLocation(node));
            log.warn(`Skipping ${ts.SyntaxKind[node.kind]} ${name}`, node); 
            log.info(`This syntax element is not currently support by crossrails`, node);
            throw SkipNodeException;
        }

    }

    private readonly createTypes: NodeVisitor<ast.Type> = {
        visitOtherNode(this: Parser, node: ts.Node): ast.Type {
            return new ast.AnyType(ast.Flags.None);
        }
    }
}

