import * as ts from "typescript";
import {log} from "../log"

export type VariableDeclaration = ts.VariableDeclaration | ts.PropertyDeclaration | ts.PropertySignature;

export interface NodeVisitor<T> {
    shouldVisitNode?(node: ts.Node): boolean
    visitSourceFile?(node: ts.SourceFile): T
    visitClass?(node: ts.ClassDeclaration): T
    visitInterface?(node: ts.InterfaceDeclaration): T
    visitNamespace?(node: ts.ModuleDeclaration): T
    visitConstructor?(node: ts.ConstructorDeclaration): T
    visitVariable?(node: VariableDeclaration): T
    visitVariableStatement?(node: ts.VariableStatement): T
    visitFunction?(node: ts.SignatureDeclaration): T
    visitParameter?(node: ts.ParameterDeclaration): T
    visitIdentifier?(node: ts.Identifier): T
    visitOtherNode?(node: ts.Node): T
    visitUnsupportedNode?(node: ts.Node): T
}

export const BreakVisitException = Symbol();
export const ContinueVisitException = Symbol();

export function* ancestry(node: ts.Node) {
    while(node = node.parent!) yield node;
}

export function visitNodes<T>(nodes: ReadonlyArray<ts.Node>, visitor: NodeVisitor<T>, visitRootNodes: boolean, thisArg: any = visitor): ReadonlyArray<T> {
    return nodes.reduce<T[]>((reduced, node) => [...reduced, ...visitNode<T>(node, visitor, visitRootNodes, thisArg)], []);           
}

export function visitNode<T>(node: ts.Node | undefined, visitor: NodeVisitor<T>, visitRootNode: boolean, thisArg: any = visitor): ReadonlyArray<T> {
    if(node === undefined) return [];
    const visit = <N extends ts.Node>(visitMethod: ((node: N) => T | Symbol) | undefined, node: N, visitChildren: (node: N) => ReadonlyArray<T> = (node) => []) => {
        if(!visitRootNode) return visitChildren(node);
        if(visitMethod && visitor.shouldVisitNode && !visitor.shouldVisitNode.call(thisArg, node)) return [];
        if(!visitMethod) visitMethod = visitor.visitOtherNode;
        try { 
            const result = visitMethod ? visitMethod.call(thisArg, node) : false;
            return result ? [result] : visitChildren(node);
        } catch(error) { 
            if(error === BreakVisitException) return []; 
            if(error === ContinueVisitException) return visitChildren(node); 
            throw error; 
        }         
    }
    switch(node.kind) {
        case ts.SyntaxKind.SourceFile: 
            return visit(visitor.visitSourceFile, node as ts.SourceFile, node => visitNodes(node.statements, visitor, true, thisArg));

        case ts.SyntaxKind.VariableStatement:
            return visit(visitor.visitVariableStatement, node as ts.VariableStatement, node => visitNodes(node.declarationList.declarations, visitor, true, thisArg));

        case ts.SyntaxKind.VariableDeclaration:
        case ts.SyntaxKind.PropertyDeclaration:
        case ts.SyntaxKind.PropertySignature:
            return visit(visitor.visitVariable, node as VariableDeclaration, node => visitNode(node.name, visitor, true, thisArg));

        case ts.SyntaxKind.FunctionDeclaration:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.MethodSignature: 
            return visit(visitor.visitFunction, node as ts.SignatureDeclaration, node =>
                [...visitNodes(node.parameters, visitor, true, thisArg),  ...visitNode(node.name, visitor, true, thisArg)]);

        case ts.SyntaxKind.Constructor: 
            return visit(visitor.visitConstructor, node as ts.ConstructorDeclaration, node =>
                visitNodes(node.parameters, visitor, true, thisArg));

        case ts.SyntaxKind.ClassDeclaration:
            return visit(visitor.visitClass, node as ts.ClassDeclaration, node => 
                [...visitNodes(node.members, visitor, true, thisArg), ...visitNode(node.name, visitor, true, thisArg)]);
                
        case ts.SyntaxKind.InterfaceDeclaration:
            return visit(visitor.visitInterface, node as ts.InterfaceDeclaration, node => 
                [...visitNodes(node.members, visitor, true, thisArg), ...visitNode(node.name, visitor, true, thisArg)]);

        case ts.SyntaxKind.ModuleDeclaration:
            return visit(visitor.visitNamespace, node as ts.ModuleDeclaration, node => 
                [...visitNodes((node.body as ts.ModuleBlock).statements, visitor, true, thisArg), ...visitNode(node.name, visitor, true, thisArg)]);

        case ts.SyntaxKind.Parameter: 
            return visit(visitor.visitParameter, node as ts.ParameterDeclaration, node => visitNode(node.name, visitor, true, thisArg));

        case ts.SyntaxKind.Identifier:
            return visit(visitor.visitIdentifier, node);

        case ts.SyntaxKind.EmptyStatement:
            return [];
            
        default:
            const result = visitor.visitUnsupportedNode && visitor.visitUnsupportedNode.call(thisArg, node);
            return result ? [result] : [];
    }    
} 
