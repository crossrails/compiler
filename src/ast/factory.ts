import * as ts from "typescript";
import {walk, NodeVisitor} from "./visitor"
import * as ast from "./ast"

class SymbolTable {

    private readonly exports = new Set<string>();
    private readonly thrown = new Set<string>();

    constructor(program: ts.Program, implicitExport: boolean) {
        this.checker = program.getTypeChecker(); 
        const visit = (node: ts.Node, visitor: Visitor<void>) => this.visit(node, visitor);
        const isVisible = (node: ts.Node): boolean => {
            const comment = new Comment(node);
            return !(node.flags & ts.NodeFlags.Private) && !comment.isTagged('private') && !comment.isTagged('access', 'private');
        }
        const addExport = (node: ts.Node): boolean => {
            let name = this.checker.getFullyQualifiedName(this.checker.getSymbolAtLocation(node))
            if(this.exports.has(name)) return false;
            this.exports.add(name);
            return true;
        }
        const addTypeReference = (node: ts.Node, visitor: Visitor<void>): void => {
            const type = this.checker.getTypeAtLocation(node);
            const name = this.checker.getFullyQualifiedName(type.symbol!);
            const exists = this.exports.has(name);
            this.exports.add(name);
            if(!exists) type.symbol!.declarations!.forEach((child: ts.Node | undefined) => {
                for(let node = child; node; node = node.parent) visit(node, visitor);
            });
        } 
        const addThrown = (node: ts.Node): void => {
            new Comment(node).tagsNamed('throws').filter(tag => tag.type).forEach(tag => this.thrown.add(tag.type.name!));
        }
        const visitor: Visitor<void> = {
            visitClass(node: ts.ClassDeclaration): void {
                if(addExport(node.name!)) {
                    node.members.filter(node => isVisible(node)).forEach(node => visit(node, visitor));
                }    
            },
            visitInterface(node: ts.InterfaceDeclaration): void {
                if(addExport(node.name)) {
                    node.members.filter(node => isVisible(node)).forEach(node => visit(node, visitor));
                }    
            },
            visitNamespace(node: ts.ModuleDeclaration): void {
                if(addExport(node.name)) {
                    const body = node.body as ts.ModuleBlock;
                    body.statements.filter(node => node.flags & ts.NodeFlags.Export).forEach(node => visit(node, visitor));
                }    
            },
            visitVariable(node: ts.VariableDeclaration | ts.PropertyDeclaration | ts.PropertySignature): void {
                if(addExport(node.name)) {
                    addTypeReference(node.name, visitor);
                }
            },
            visitFunction(node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.MethodSignature): void {
                if(addExport(node.name!)) {
                    addTypeReference(node.name!, visitor);
                    node.parameters.forEach(param => addTypeReference(param.name, visitor));                
                    addThrown(node);                    
                }        
            },
            visitConstructor(node: ts.ConstructorDeclaration): void {
                if(addExport(node.name!)) {
                    node.parameters.forEach(param => addTypeReference(param.name, visitor));                
                    addThrown(node);
                }                
            }
        };
        let nodes = program.getSourceFiles().reduce((statements, file) => [...statements, ...file.statements], [] as ts.Node[]);
        if(!implicitExport) {
            nodes = nodes.filter(node => (node.flags & ts.NodeFlags.Export) || new Comment(node).isTagged('export'))
        }
        nodes.forEach(node => this.visit(node, visitor));
    }



}

type Factory = <T>(node: ts.Node, parent: ast.Declaration|ast.SourceFile, factory: Factory) => T[] 

export function createFactory(program: ts.Program, implicitExport: boolean): Factory {
    const referenced = new Set<string>();
    const exports = new Set<string>();
    const thrown = new Set<string>();
    const checker = program.getTypeChecker();
    
    program.getSourceFiles().forEach(file => walk(file, {
        visitIdentifier(this: NodeVisitor<boolean>, node: ts.Identifier) {
            const symbol = checker.getSymbolAtLocation(node);
            const name = checker.getFullyQualifiedName(symbol);
            if(!referenced.has(name) && !(symbol.flags & ts.SymbolFlags.Export)) return true;
            if(exports.has(name)) return true;
            exports.add(name);
            const type = checker.getTypeOfSymbolAtLocation(symbol, node);
            const unexported = !exports.has(checker.getFullyQualifiedName(type.getSymbol()));
            if(unexported) type.getSymbol().getDeclarations().forEach((child: ts.Node | undefined) => {
                for(let node = child; node; node = node.parent) walk(node, this);
            });
            return false;
        }
        //do exports and save references then walk reference parents to avoid walking the same node several times
    }));
    const factory = (node: ts.Node, parent: ast.Declaration|ast.SourceFile) => walk(node, {
        visitNamespace(node: ts.ModuleDeclaration) {
            return new ast.NamespaceDeclaration(node, parent, factory);           
        }
    });
    return factory;
}