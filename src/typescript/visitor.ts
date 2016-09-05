import * as ts from "typescript";
import {log} from "../log"

export type VariableDeclaration = ts.VariableDeclaration | ts.PropertyDeclaration | ts.PropertySignature;
export type FunctionDeclaration = ts.FunctionDeclaration | ts.MethodDeclaration | ts.MethodSignature;

export interface NodeVisitor<T> {
    shouldVisitNode?(node: ts.Node): boolean
    visitSourceFile?(node: ts.SourceFile): T | Symbol
    visitClass?(node: ts.ClassDeclaration): T | Symbol
    visitInterface?(node: ts.InterfaceDeclaration): T | Symbol
    visitNamespace?(node: ts.ModuleDeclaration): T | Symbol
    visitConstructor?(node: ts.ConstructorDeclaration): T | Symbol
    visitVariable?(node: VariableDeclaration): T | Symbol
    visitVariableStatement?(node: ts.VariableStatement): T | Symbol
    visitFunction?(node: FunctionDeclaration): T | Symbol
    visitParameter?(node: ts.ParameterDeclaration): T | Symbol
    visitIdentifier?(node: ts.Identifier): T | Symbol
    visitOtherNode?(node: ts.Node): T | Symbol
}

export const BreakVisit = Symbol();

export function* ancestry(node: ts.Node) {
    while(node = node.parent!) yield node;
}

export function visitNodes<T>(nodes: ReadonlyArray<ts.Node>, visitor: NodeVisitor<T>, visitRootNodes: boolean, thisArg: any = visitor): ReadonlyArray<T> {
    return nodes.reduce<T[]>((reduced, node) => [...reduced, ...visitNode<T>(node, visitor, visitRootNodes, thisArg)], []);           
}

export function visitNode<T>(node: ts.Node, visitor: NodeVisitor<T>, visitRootNode: boolean, thisArg: any = visitor): ReadonlyArray<T> {
    const visit = <N extends ts.Node>(visitMethod: ((node: N) => T | Symbol) | undefined, node: N, visitChildren: (node: N) => ReadonlyArray<T> | undefined = (node) => []) => {
        if(!visitRootNode) return visitChildren(node);
        if(visitMethod && visitor.shouldVisitNode && !visitor.shouldVisitNode.call(thisArg, node)) return [];
        if(!visitMethod) visitMethod = visitor.visitOtherNode; 
        const result = visitMethod ? visitMethod.call(thisArg, node) : false;
        return result ? (result === BreakVisit ? [] : [result]) : visitChildren(node);
    }
    const visitChild = (node: ts.Node) => visitNode(node, visitor, true, thisArg);
    const visitChildren = (nodes: ReadonlyArray<ts.Node>) => {
        let result = visitNodes(nodes, visitor, true, thisArg);
        return result.length ? result : undefined
    };
    switch(node.kind) {
        case ts.SyntaxKind.SourceFile: 
            return visit(visitor.visitSourceFile, node as ts.SourceFile, node => visitChildren(node.statements)) || [];

        case ts.SyntaxKind.VariableStatement:
            return visit(visitor.visitVariableStatement, node as ts.VariableStatement, node => 
                visitChildren(node.declarationList.declarations)) || [];

        case ts.SyntaxKind.VariableDeclaration:
        case ts.SyntaxKind.PropertyDeclaration:
        case ts.SyntaxKind.PropertySignature:
            return visit(visitor.visitVariable, node as VariableDeclaration, node => visitChild(node.name)) || [];

        case ts.SyntaxKind.FunctionDeclaration:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.MethodSignature: 
            return visit(visitor.visitFunction, node as FunctionDeclaration, node =>
                visitChildren(node.parameters) || (node.name && visitChild(node.name))) || [];

        case ts.SyntaxKind.Constructor: 
            return visit(visitor.visitConstructor, node as ts.ConstructorDeclaration, node =>
                visitChildren(node.parameters)) || [];

        case ts.SyntaxKind.ClassDeclaration:
            return visit(visitor.visitClass, node as ts.ClassDeclaration, node => 
                visitChildren(node.members) || (node.name && visitChild(node.name))) || [];
                
        case ts.SyntaxKind.InterfaceDeclaration:
            return visit(visitor.visitInterface, node as ts.InterfaceDeclaration, node => 
                visitChildren(node.members) || (node.name && visitChild(node.name))) || [];

        case ts.SyntaxKind.ModuleDeclaration:
            return visit(visitor.visitNamespace, node as ts.ModuleDeclaration, node => 
                visitChildren((node.body as ts.ModuleBlock).statements) || visitChild(node.name)) || [];

        case ts.SyntaxKind.Parameter: 
            return visit(visitor.visitParameter, node as ts.ParameterDeclaration, node => visitChild(node.name)) || [];

        case ts.SyntaxKind.Identifier:
            return visit(visitor.visitIdentifier, node) || [];
            
        default:
            return visit(visitor.visitOtherNode, node) || [];
    }    
} 
