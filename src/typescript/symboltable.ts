import * as assert from 'assert';
import * as ts from "typescript";
import * as ast from "../ast"
import {log} from "../log"
import {Comment} from "../comment"
import {visitNode, visitNodes, ancestry, NodeVisitor, VariableDeclaration, FunctionDeclaration, BreakVisit} from "./visitor"

export class SymbolTable implements NodeVisitor<void> {

    private readonly checker: ts.TypeChecker;
    private readonly implicitExport: boolean;
    private readonly symbols = new Set<string>();
    private readonly exports = new Map<ts.Declaration, ReadonlyArray<ts.Declaration>>();
    private readonly thrown = new Set<string>();
    private readonly knownTypes = new Set<string>();

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

    isThrown(node: ts.ClassDeclaration): boolean {
        const symbol = this.checker.getSymbolAtLocation(node.name!);
        return this.thrown.has(this.checker.getFullyQualifiedName(symbol));        
    }

    getName(node: ts.Node & { name?: ts.DeclarationName}) {
        return node.name ? this.checker.symbolToString(this.checker.getSymbolAtLocation(node.name)) : '';
    }

    getType(node: ts.Declaration & {type?: ts.TypeNode}, defaultType?: ((flags: ast.Flags) => ast.Type)): ast.Type {
        return this.createType(node, this.checker.getTypeAtLocation(node), node.type, ast.Flags.None, defaultType);
    }

    getSignature(node: ts.SignatureDeclaration): ast.FunctionSignature {
        return this.createSignature(node, this.checker.getSignatureFromDeclaration(node as ts.SignatureDeclaration));
    }

    private createSignature(node: ts.Declaration & {type?: ts.TypeNode}, signature: ts.Signature) {
        const parameters = signature.parameters.map(parameter => {
            const declaration = parameter.valueDeclaration as ts.ParameterDeclaration;
            const type = this.createType(node, this.checker.getTypeOfSymbolAtLocation(parameter, declaration), declaration.type)
            return new ast.ParameterDeclaration(parameter.name, declaration.questionToken ? ast.Flags.Optional : ast.Flags.None, type);
        });
        const returnType = this.createType(node, signature.getReturnType(), signature.declaration.type, ast.Flags.None, (flags) => new ast.VoidType(flags));
        const thrownTypes = new Comment(node).tagsNamed('throws').map(tag => tag.type ? this.createReferenceType(node, tag.type.name!) : new ast.AnyType());
        return new ast.FunctionSignature(parameters, returnType, thrownTypes);        
    }

    private createType(node: ts.Declaration & {type?: ts.TypeNode}, type: ts.Type, typeNode: ts.TypeNode | undefined, flags: ast.Flags = ast.Flags.None, defaultType: (flags: ast.Flags) => ast.Type = (flags) => new ast.AnyType(flags)): ast.Type {
        const mask = function* () { for(let i=1; i < (1<<30); i = i << 1) if(type.flags & i) yield i; }
        switch(type.flags) {
            case ts.TypeFlags.Never:
                break;
            case ts.TypeFlags.Void:
                return new ast.VoidType(flags);
            case ts.TypeFlags.Boolean | ts.TypeFlags.Union:
                return new ast.BooleanType(flags);
            case ts.TypeFlags.Number:
                return new ast.NumberType(flags);
            case ts.TypeFlags.String:
                return new ast.StringType(flags);
            case ts.TypeFlags.Anonymous:
                return new ast.FunctionType(flags, this.createSignature(node, type.getCallSignatures()[0]));
            case ts.TypeFlags.Any:
                return new ast.AnyType(typeNode && typeNode.kind == ts.SyntaxKind.UnionType ? ast.Flags.Optional : ast.Flags.None);
            case ts.TypeFlags.Interface:
                flags |= ast.Flags.Abstract;
                //fallthrough
            case ts.TypeFlags.Reference:
            case ts.TypeFlags.Class | ts.TypeFlags.Reference:
                return this.createReferenceType(node, this.checker.getFullyQualifiedName(type.getSymbol()), flags, (type as ts.TypeReference).typeArguments, typeNode && (typeNode as ts.TypeReferenceNode).typeArguments);
            case ts.TypeFlags.Union: 
                const nonNullableType = this.checker.getNonNullableType(type);
                if(nonNullableType != type) { 
                    return this.createType(node, nonNullableType, typeNode, typeNode && typeNode.kind == ts.SyntaxKind.UnionType ? ast.Flags.Optional : ast.Flags.None);
                }
                //fallthrough
           default:
                log.warn(`Unsupported type ${this.checker.typeToString(type)}: ${[...mask()].map(i => `${ts.TypeFlags[i]}`).join(', ')}, erasing to Any`, node);            
                return new ast.AnyType();
        }
        log.warn(`Type information missing for ${ts.SyntaxKind[node.kind]} ${this.checker.symbolToString(this.checker.getSymbolAtLocation(node.name!))}, resorting to Any`, node);  
        log.info(`Resolve this warning by adding a typescript type annotation or a jsdoc type tag`);
        return defaultType(flags);
    }

    private createReferenceType(node: ts.Declaration & {type?: ts.TypeNode}, name: string, flags: ast.Flags = ast.Flags.None, typeArguments: ts.Type[] = [], typeArgumentNodes: ts.TypeNode[] = []) {
        switch(name) {
            case 'boolean':
                return new ast.BooleanType(flags);
            case 'number':
                return new ast.NumberType(flags);
            case 'string':
                return new ast.StringType(flags);
            case 'Object':
                return new ast.AnyType(flags);
            case 'Date':
                return new ast.DateType(flags);
            case 'Error':
                return new ast.ErrorType(flags);
            case 'Array':
            case 'ReadonlyArray':
                return new ast.ArrayType(flags, typeArguments.map((t, i) => this.createType(node, t, typeArgumentNodes[i])));
            default:
                if(!this.knownTypes.has(name)) {
                    log.warn(`Could not find type ${name}`, node); 
                    log.info(`Resolve this error by adding the source for ${name} to the input file otherwise output will not compile standalone`) 
                }
                if(this.thrown.has(name)) flags |= ast.Flags.Thrown;
                return new ast.DeclaredType(name, flags, typeArguments.map((t, i) => this.createType(node, t, typeArgumentNodes[i])));
        }
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

    visitSourceFile(node: ts.SourceFile) {
        this.exports.set(node, [node]);
    }

    visitFunction(node: FunctionDeclaration) {
        const comment = new Comment(node);
        comment.tagsNamed('throws').filter(tag => tag.type).forEach(tag => this.thrown.add(tag.type.name!));
    }

    visitConstructor(node: ts.ConstructorDeclaration) {
        this.exports.set(node, [node]);        
    }

    visitIdentifier(node: ts.Identifier): void | Symbol {
        const symbol = this.checker.getSymbolAtLocation(node);
        const comment = new Comment(node.parent!);
        const isExported = this.implicitExport || symbol.flags ^ ts.SymbolFlags.Export || comment.isTagged('export');
        const isPrivate = node.parent!.flags & ts.NodeFlags.Private || comment.isTagged('private') || comment.isTagged('access', 'private');
        if(!isExported || isPrivate) return BreakVisit;
        const symbolName = this.checker.getFullyQualifiedName(symbol);
        if(this.symbols.has(symbolName)) return BreakVisit;        
        this.symbols.add(symbolName);
        if(symbol.flags & ts.SymbolFlags.Type) this.knownTypes.add(symbolName);
        const declaration = symbol.getDeclarations().reduce((main, d) => !main || (main.kind == ts.SyntaxKind.ModuleDeclaration && d.kind != ts.SyntaxKind.ModuleDeclaration) ? d : main); 
        this.exports.set(declaration, symbol.getDeclarations());
        //if type reference ensure type is exported
        const type = this.checker.getTypeOfSymbolAtLocation(symbol, node);
        if(type.flags ^ ts.TypeFlags.Reference) return;
        const target = (type as ts.TypeReference).target;
        const typeName = this.checker.getFullyQualifiedName(target.getSymbol());
        if(this.symbols.has(typeName)) return; 
        target.getSymbol().getDeclarations().forEach((child: ts.Node | undefined) => {
            [...ancestry(node)].forEach(n =>  n.flags |= ts.NodeFlags.Export);
            visitNode(node.getSourceFile(), this, true);
        });
    }
}

