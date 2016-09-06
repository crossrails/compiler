import * as assert from 'assert';
import * as ts from "typescript";
import * as ast from "../ast"
import {log} from "../log"
import {Comment} from "../comment"
import {visitNode, visitNodes, ancestry, NodeVisitor, VariableDeclaration, BreakVisitException, ContinueVisitException} from "./visitor"

export class SymbolTable implements NodeVisitor<void> {

    private readonly checker: ts.TypeChecker;
    private readonly implicitExport: boolean;
    private readonly symbols = new Set<ts.Symbol>();
    private readonly exports = new Map<ts.Declaration, ReadonlyArray<ts.Declaration>>();
    private readonly thrown = new Set<ts.Symbol>();

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
        return this.thrown.has(this.checker.getSymbolAtLocation(node.name!));        
    }

    getName(node: ts.Node & { name?: ts.DeclarationName}) {
        return node.name ? this.checker.symbolToString(this.checker.getSymbolAtLocation(node.name)) : '';
    }

    getType<T extends ast.Type>(node: ts.Declaration & {type?: ts.TypeNode}, defaultType?: ((flags: ast.Flags) => ast.Type)): T {
        return this.createType(node, this.checker.getTypeAtLocation(node), node.type, ast.Flags.None, defaultType) as T;
    }

    getSignature(node: ts.SignatureDeclaration): ast.FunctionSignature {
        return this.createSignature(node, this.checker.getSignatureFromDeclaration(node as ts.SignatureDeclaration));
    }

    private getMainDeclaration(symbol: ts.Symbol) {
        return symbol.getDeclarations().reduce((main, d) => !main || (main.kind == ts.SyntaxKind.ModuleDeclaration && d.kind != ts.SyntaxKind.ModuleDeclaration) ? d : main);
    }

    private exportIfNecessary(symbol: ts.Symbol) {
        if(this.exports.has(this.getMainDeclaration(symbol))) return; 
        symbol.getDeclarations().forEach((node: ts.Node) => {
            [...ancestry(node)].forEach(n => n.flags |= ts.NodeFlags.Export);
            visitNode(node.getSourceFile(), this, true);
        });
    }

    private getThrownSymbols(node: ts.SignatureDeclaration, tags: ReadonlyArray<Comment.Tag> = Comment.fromNode(node).tagsNamed('throws')): ReadonlyArray<ts.Symbol> {
        const names = new Set(tags.filter(tag => tag.type && tag.type.name).map(tag => tag.type.name!));
        if(names.size == 0) return [];
        let symbols = this.checker.getSymbolsInScope(node, ts.SymbolFlags.Type);
        return symbols.filter(s => names.has(this.checker.symbolToString(s, node, ts.SymbolFlags.Type)));
    }

    private createSignature(node: ts.SignatureDeclaration, signature: ts.Signature) {
        const parameters = signature.parameters.map(parameter => {
            const declaration = parameter.valueDeclaration as ts.ParameterDeclaration;
            const type = this.createType(node, this.checker.getTypeOfSymbolAtLocation(parameter, declaration), declaration.type)
            return new ast.ParameterDeclaration(parameter.name, declaration.questionToken ? ast.Flags.Optional : ast.Flags.None, type);
        });
        const returnType = this.createType(node, signature.getReturnType(), signature.declaration.type, ast.Flags.None, (flags) => new ast.VoidType(flags));
        const throwsTags = Comment.fromNode(node).tagsNamed('throws');
        const thrownTypes = this.getThrownSymbols(node, throwsTags).map(symbol => this.createReferenceType(node, symbol));
        return new ast.FunctionSignature(parameters, returnType, thrownTypes.length == throwsTags.length ? thrownTypes : [...thrownTypes, new ast.AnyType()]);        
    }

    private createType(node: ts.Declaration, type: ts.Type, typeNode: ts.TypeNode | undefined, flags: ast.Flags = ast.Flags.None, defaultType: (flags: ast.Flags) => ast.Type = (flags) => new ast.AnyType(flags)): ast.Type {
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
                return new ast.FunctionType(flags, this.createSignature(node as ts.SignatureDeclaration, type.getCallSignatures()[0]));
            case ts.TypeFlags.Any:
                return new ast.AnyType(typeNode && typeNode.kind == ts.SyntaxKind.UnionType ? ast.Flags.Optional : ast.Flags.None);
            case ts.TypeFlags.Interface:
                flags |= ast.Flags.Abstract;
                //fallthrough
            case ts.TypeFlags.Reference:
            case ts.TypeFlags.Class | ts.TypeFlags.Reference:
                const reference = type as ts.TypeReference;
                return this.createReferenceType(node, reference/*.target*/.getSymbol(), flags, reference.typeArguments, typeNode && (typeNode as ts.TypeReferenceNode).typeArguments);
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
        log.warn(`Type information missing for ${ts.SyntaxKind[node.kind]} ${this.checker.symbolToString(this.checker.getSymbolAtLocation(node.name!))}, resorting to ${defaultType(flags).constructor.name.replace('Type', '')}`, node);  
        log.info(`Resolve this warning by adding a typescript type annotation or a jsdoc type tag`);
        return defaultType(flags);
    }

    private createReferenceType(node: ts.Declaration, symbol: ts.Symbol, flags: ast.Flags = ast.Flags.None, typeArguments: ts.Type[] = [], typeArgumentNodes: ts.TypeNode[] = []) {
        switch(this.checker.getFullyQualifiedName(symbol)) {
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
                const name = this.checker.symbolToString(symbol);
                if(!this.symbols.has(symbol)) {
                    log.warn(`Could not find type ${name}`, node); 
                    log.info(`Resolve this error by adding the source for ${name} to the input file otherwise output will not compile standalone`) 
                }
                if(this.thrown.has(symbol)) flags |= ast.Flags.Thrown;
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

    visitSourceFile(node: ts.SourceFile) {
        this.exports.set(node, [node]);
        // console.log(JSON.stringify(ts.createSourceFile(node.fileName, node.getFullText(), ts.ScriptTarget.ES6, false), (key, value) => { 
        //     return value ? Object.assign(value, { kind: ts.SyntaxKind[value.kind], flags: ts.NodeFlags[value.flags] }) : value; 
        // }, 4)); 
    }

    visitFunction(node: ts.SignatureDeclaration): void {
        this.visitOtherNode(node);
        this.getThrownSymbols(node).forEach(symbol => {
            this.exportIfNecessary(symbol);
            this.thrown.add(symbol)
        });
    }

    visitConstructor(node: ts.ConstructorDeclaration): void {
        this.visitOtherNode(node);
        this.exports.set(node, [node]);        
    }

    visitVariable(node: VariableDeclaration): void {
        if(node.kind != ts.SyntaxKind.VariableDeclaration) this.visitOtherNode(node);        
    }

    visitOtherNode(node: ts.Node): void {
        switch(node.parent!.kind) {
            case ts.SyntaxKind.SourceFile:
                if(this.implicitExport || Comment.fromNode(node).isTagged('export')) break;
                //fallthrough
            case ts.SyntaxKind.ModuleBlock:
                if(node.flags & ts.NodeFlags.Export) break;
                throw BreakVisitException;
            default:
                if(node.flags & ts.NodeFlags.Private) throw BreakVisitException;
                const comment = Comment.fromNode(node);
                if(comment.isTagged('private') || comment.isTagged('access', 'private')) throw BreakVisitException;
        }
    }

    visitIdentifier(node: ts.Identifier): void {
        const symbol = this.checker.getSymbolAtLocation(node);
        if(this.symbols.has(symbol)) throw BreakVisitException;        
        this.symbols.add(symbol);
        this.exports.set(this.getMainDeclaration(symbol), symbol.getDeclarations());
        //if type reference ensure type is exported
        const type = this.checker.getTypeOfSymbolAtLocation(symbol, node);
        if((type.flags & ts.TypeFlags.Reference) == 0) return;
        const target = (type as ts.TypeReference).target;
    }
}

