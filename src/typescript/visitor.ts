import * as ts from "typescript";

export type VariableDeclaration = ts.VariableDeclaration | ts.PropertyDeclaration | ts.PropertySignature;
export type FunctionDeclaration = ts.FunctionDeclaration | ts.MethodDeclaration | ts.MethodSignature;

export interface NodeVisitor<T> {
    shouldVisitNode?(node: ts.Node): boolean
    visitSourceFile?(node: ts.SourceFile): T
    visitClass?(node: ts.ClassDeclaration): T
    visitInterface?(node: ts.InterfaceDeclaration): T
    visitNamespace?(node: ts.ModuleDeclaration): T
    visitConstructor?(node: ts.ConstructorDeclaration): T
    visitVariable?(node: VariableDeclaration): T
    visitFunction?(node: FunctionDeclaration): T
    visitParameter?(node: ts.ParameterDeclaration): T
    visitIdentifier?(node: ts.Identifier): T
    visitOtherNode?(node: ts.Node): T
}

export function visitNodes<T>(nodes: ReadonlyArray<ts.Node>, visitor: NodeVisitor<T>, visitRootNodes: boolean = true, thisArg: any = visitor): ReadonlyArray<T> {
    return nodes.reduce<T[]>((reduced, node) => [...reduced, ...visitNode<T>(node, visitor, visitRootNodes, thisArg)], []);           
}

export function visitNode<T>(node: ts.Node, visitor: NodeVisitor<T>, visitRootNode: boolean = true, thisArg: any = visitor): ReadonlyArray<T> {
    const visit = <N extends ts.Node>(visitMethod: ((node: N) => T) | undefined, node: N, visitChildren: (node: N) => ReadonlyArray<T> = (node) => []) => {
        if(!visitRootNode) return visitChildren(node); 
        if((visitMethod || visitor.visitOtherNode) && visitor.shouldVisitNode && !visitor.shouldVisitNode(node)) return [];
        if(!visitMethod) return visitor.visitOtherNode ? Function.call(visitor.visitOtherNode, thisArg, node) : [];
        const result = Function.call(visitMethod, thisArg, node);
        return result ? [result] : visitChildren(node);
    }
    switch(node.kind) {
        case ts.SyntaxKind.SourceFile: 
            return visit(visitor.visitSourceFile, node as ts.SourceFile, (node) => {
                return node.statements.reduce((t: T[], n: ts.Node) => [...t, ...visitNode(n, visitor)], [])                
            });        
        case ts.SyntaxKind.VariableStatement:
            const variables = (node as ts.VariableStatement).declarationList.declarations;
            return variables.reduce((t: T[], n: ts.Node) => [...t, ...visitNode(n, visitor)], []);
        case ts.SyntaxKind.VariableDeclaration:
        case ts.SyntaxKind.PropertyDeclaration:
        case ts.SyntaxKind.PropertySignature:
            return visit(visitor.visitVariable, node as VariableDeclaration, (node) => visitNode(node.name, visitor));
        case ts.SyntaxKind.FunctionDeclaration:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.MethodSignature: 
            return visit(visitor.visitFunction, node as FunctionDeclaration, (node) => {
                return visitNode(node.name!, visitor) || node.parameters.reduce((t: ReadonlyArray<T>, n: ts.Node) => [...t, ...visitNode(n, visitor)], [])                
            });        
        case ts.SyntaxKind.Constructor: 
            return visit(visitor.visitConstructor, node as ts.ConstructorDeclaration, (node) => {
                return node.parameters.reduce((t: T[], n: ts.Node) => [...t, ...visitNode(n, visitor)], [])                
            });        
        case ts.SyntaxKind.ClassDeclaration:
            return visit(visitor.visitClass, node as ts.ClassDeclaration, (node) => {
                return visitNode(node.name!, visitor) || node.members.reduce((t: T[], n: ts.Node) => [...t, ...visitNode(n, visitor)], [])                
            });        
        case ts.SyntaxKind.InterfaceDeclaration:
            return visit(visitor.visitInterface, node as ts.InterfaceDeclaration, (node) => {
                return visitNode(node.name, visitor) || node.members.reduce((t: T[], n: ts.Node) => [...t, ...visitNode(n, visitor)], [])                
            });        
        case ts.SyntaxKind.ModuleDeclaration:
            return visit(visitor.visitNamespace, node as ts.ModuleDeclaration, (node) => {
                const statements = (node.body as ts.ModuleBlock).statements;
                return visitNode(node.name, visitor) || statements.reduce((t: T[], n: ts.Node) => [...t, ...visitNode(n, visitor)], [])                
            });        
        case ts.SyntaxKind.Parameter: 
            return visit(visitor.visitParameter, node as ts.ParameterDeclaration, (node) => visitNode(node.name, visitor));
        case ts.SyntaxKind.Identifier:
            return visit(visitor.visitIdentifier, node);
        default:
            return visit(visitor.visitOtherNode, node);
    }    
} 
