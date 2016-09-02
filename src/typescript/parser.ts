import * as ts from "typescript";
import * as ast from "../ast"
import {readFileSync} from 'fs';
import {log} from "../log"
import {Comment} from "../comment"
import {SymbolTable} from './symboltable'
import {visitNode, visitNodes, ancestry, NodeVisitor, VariableDeclaration, FunctionDeclaration, SkipNodeException} from "./visitor"

function getFlags(node: ts.Node): ast.Flags {
    const comment = new Comment(node);
    const isAbstract = (node.flags & ts.NodeFlags.Abstract) || comment.isTagged('abstract') || comment.isTagged('virtual') || [...ancestry(node)].some(n => n.kind == ts.SyntaxKind.InterfaceDeclaration); 
    const isProtected = (node.flags & ts.NodeFlags.Protected) || comment.isTagged('protected') || comment.isTagged('access', 'protected');
    const isStatic = (node.flags & ts.NodeFlags.Static) || comment.isTagged('static') || [...ancestry(node)].every(n => n.kind != ts.SyntaxKind.InterfaceDeclaration && n.kind != ts.SyntaxKind.ClassDeclaration);
    return (isAbstract ? ast.Flags.Abstract : ast.Flags.None) | (isProtected ? ast.Flags.Protected : ast.Flags.None) | (isStatic ? ast.Flags.Static : ast.Flags.None);
}

export class Parser implements NodeVisitor<ast.Declaration>{

    private readonly program: ts.Program;
    private readonly symbols: SymbolTable;
    private readonly checker: ts.TypeChecker;
    
    constructor(program: ts.Program, implicitExport: boolean) {
        this.program = program;
        this.checker = program.getTypeChecker();
        this.symbols = new SymbolTable(program, implicitExport);
    }

    parse(sourceRoot: string): ast.Module {
        return new ast.Module(sourceRoot, visitNodes(this.program.getSourceFiles().filter(f => !f.hasNoDefaultLib), this, true) as ast.SourceFile[]);
    }

    private getType(name: ts.DeclarationName, defaultType?: ((flags: ast.Flags) => ast.Type)): ast.Type {
        return this.createType(name, this.checker.getTypeAtLocation(name), ast.Flags.None, defaultType);
    }

    private createType(name: ts.DeclarationName, type: ts.Type, flags: ast.Flags, defaultType: (flags: ast.Flags) => ast.Type = (flags) => new ast.AnyType(flags)): ast.Type {
        const mask = function* () { for(let i=1; i < (1<<30); i = i << 1) if(type.flags & i) yield i; }
        switch(type.flags) {
            case ts.TypeFlags.Never:
                break;
            case ts.TypeFlags.Void:
                return new ast.VoidType(flags);
            case ts.TypeFlags.Any:
                return new ast.AnyType(flags);
            case ts.TypeFlags.Boolean | ts.TypeFlags.Union:
                return new ast.BooleanType(flags);
            case ts.TypeFlags.Number:
                return new ast.NumberType(flags);
            case ts.TypeFlags.String:
                return new ast.StringType(flags);
            case ts.TypeFlags.Anonymous:
                break;
                // return new ast.FunctionType(this.checker.getSignaturesOfType(type, ts.SignatureKind.Call)[0]);
            case ts.TypeFlags.Reference:
                const reference = type as ts.TypeReference;
                console.log(this.checker.symbolToString(type.symbol!));
                switch(this.checker.symbolToString(type.symbol!)) {
                    case 'Object':
                        return new ast.AnyType(flags);
                    case 'Date':
                        return new ast.DateType(flags);
                    case 'Error':
                        return new ast.ErrorType(flags);
                    case 'Array':
                    case 'ReadonlyArray':
                        return new ast.ArrayType(flags, reference.typeArguments.map(t => this.createType(name, t, ast.Flags.None)));
                    default:
                        break;
                        // return new DeclaredType(reference, optional, parent, factory);
                }
                break;
            case ts.TypeFlags.Union: 
                const union = type as ts.UnionType;
                if(union.types.length == 2) {
                    if(union.types[0].flags == ts.TypeFlags.Null || union.types[0].flags ==  ts.TypeFlags.Undefined) {
                        return this.createType(name, union.types[1], ast.Flags.Optional);
                    } else if(union.types[1].flags == ts.TypeFlags.Null || union.types[1].flags == ts.TypeFlags.Undefined) {
                        return this.createType(name, union.types[0], ast.Flags.Optional);                        
                    }
                }
                log.warn(`Unsupported type union ${this.checker.typeToString(type)}: ${[...mask()].map(i => `${ts.TypeFlags[i]}`).join(', ')}, only unions between null or undefined and a single type supported, erasing to Any`, name);            
                return new ast.AnyType();
            default:
                log.warn(`Unsupported flags ${[...mask()].map(i => `${ts.TypeFlags[i]}`).join(', ')} on type ${this.checker.typeToString(type)}, erasing to Any`, name);            
                return new ast.AnyType();
        }
        log.warn(`Type information missing for ${ts.SyntaxKind[name.parent!.kind]} ${this.checker.symbolToString(this.checker.getSymbolAtLocation(name))}, resorting to Any`, name);  
        log.info(`Resolve this warning by adding a typescript type annotation or a jsdoc type tag`, name);
        return defaultType(flags);
    }

    shouldVisitNode(node: ts.Declaration): boolean {
        if(this.symbols.isExported(node)) return true;
        log.debug(`Skipping unexported ${ts.SyntaxKind[node.kind]} ${node.name && this.checker.symbolToString(this.checker.getSymbolAtLocation(node.name))}`, node);
        return false;
    }

    visitSourceFile(node: ts.SourceFile): ast.Declaration {
        // console.log(JSON.stringify(ts.createSourceFile(node.fileName, readFileSync(node.fileName).toString(), ts.ScriptTarget.ES6, false), (key, value) => { 
        //     return value ? Object.assign(value, { kind: ts.SyntaxKind[value.kind], flags: ts.NodeFlags[value.flags] }) : value; 
        // }, 4)); 
        return new ast.SourceFile(node.fileName, visitNode(node, this, false));
    }

    visitNamespace(node: ts.ModuleDeclaration): ast.Declaration {
        return new ast.NamespaceDeclaration(node.name!.text, getFlags(node), visitNodes(this.symbols.getExports(node), this, false));           
    }

    visitClass(node: ts.ClassDeclaration): ast.Declaration {
        const flags = getFlags(node) | (this.symbols.isThrown(node) ? ast.Flags.Thrown : ast.Flags.None);
        const typeParameters = node.typeParameters ? node.typeParameters.map(t => this.getType(t.name)) : []; 
        return new ast.ClassDeclaration(node.name!.text, getFlags(node), visitNodes(this.symbols.getExports(node), this, false), typeParameters);           
    }

    visitInterface(node: ts.InterfaceDeclaration): ast.Declaration {
        const typeParameters = node.typeParameters ? node.typeParameters.map(t => this.getType(t.name)) : []; 
        return new ast.InterfaceDeclaration(node.name!.text, getFlags(node), visitNodes(this.symbols.getExports(node), this, false), typeParameters);           
    }

    visitConstructor(node: ts.ConstructorDeclaration): ast.Declaration {
        const signature = new ast.FunctionSignature(visitNodes(node.parameters, this, true) as ast.ParameterDeclaration[], new ast.VoidType(), []);
        const typeParameters = node.typeParameters ? node.typeParameters.map(t => this.getType(t.name)) : []; 
        return new ast.ConstructorDeclaration(getFlags(node), signature, typeParameters);
    }

    visitFunction(node: FunctionDeclaration): ast.Declaration {
        let type = this.getType(node.name!, (flags) => new ast.VoidType(flags));
        const signature = new ast.FunctionSignature(visitNodes(node.parameters, this, true) as ast.ParameterDeclaration[], type, []);
        const typeParameters = node.typeParameters ? node.typeParameters.map(t => this.getType(t.name)) : []; 
        return new ast.FunctionDeclaration((node.name as ts.Identifier).text, getFlags(node), signature, typeParameters);
    }

    visitVariable(node: VariableDeclaration): ast.Declaration {
        let type = this.getType(node.name, (flags) => {
            return new ast.AnyType(flags);
        });
        const flags = getFlags(node) | (node.parent && (node.parent.flags & ts.NodeFlags.Const) != 0 ? ast.Flags.Constant : ast.Flags.None);
        return new ast.VariableDeclaration((node.name as ts.Identifier).text, flags, type);
    }

    visitParameter(node: ts.ParameterDeclaration): ast.Declaration {
        let type = this.getType(node.name);
        return new ast.ParameterDeclaration((node.name as ts.Identifier).text, getFlags(node), type);
    }

    visitOtherNode(node: ts.Node): ast.Declaration {
        const name = this.program.getTypeChecker().symbolToString(this.program.getTypeChecker().getSymbolAtLocation(node));
        log.warn(`Skipping ${ts.SyntaxKind[node.kind]} ${name}`, node); 
        log.info(`This syntax element is not currently support by crossrails`, node);
        throw SkipNodeException;
    }
}

