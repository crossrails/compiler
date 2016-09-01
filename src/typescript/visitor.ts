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

export function visitNodes<T>(nodes: ReadonlyArray<ts.Node>, visitor: NodeVisitor<T>, visitRootNodes: boolean, thisArg: any = visitor): ReadonlyArray<T> {
    return nodes.reduce<T[]>((reduced, node) => [...reduced, ...visitNode<T>(node, visitor, visitRootNodes, thisArg)], []);           
}

export function visitNode<T>(node: ts.Node, visitor: NodeVisitor<T>, visitRootNode: boolean, thisArg: any = visitor): ReadonlyArray<T> {
    const visit = <N extends ts.Node>(visitMethod: ((node: N) => T) | undefined, node: N, visitChildren: (node: N) => ReadonlyArray<T> = (node) => []) => {
        if(!visitRootNode) return visitChildren(node);
        if(!visitMethod) visitMethod = visitor.visitOtherNode; 
        if(visitMethod && visitor.shouldVisitNode && !visitor.shouldVisitNode.call(thisArg, node)) return [];
        const result = visitMethod ? visitMethod.call(thisArg, node) : false;
        return result ? [result] : visitChildren(node);
    }
    const visitChild = (node: ts.Node) => visitNode(node, visitor, true, thisArg);
    const visitChildren = (nodes: ReadonlyArray<ts.Node>) => visitNodes(nodes, visitor, true, thisArg);
    switch(node.kind) {
        case ts.SyntaxKind.SourceFile: 
            return visit(visitor.visitSourceFile, node as ts.SourceFile, node => visitChildren(node.statements));

        case ts.SyntaxKind.VariableStatement:
            return visitChildren((node as ts.VariableStatement).declarationList.declarations);

        case ts.SyntaxKind.VariableDeclaration:
        case ts.SyntaxKind.PropertyDeclaration:
        case ts.SyntaxKind.PropertySignature:
            return visit(visitor.visitVariable, node as VariableDeclaration, node => visitChild(node.name));

        case ts.SyntaxKind.FunctionDeclaration:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.MethodSignature: 
            return visit(visitor.visitFunction, node as FunctionDeclaration, node =>
                visitChild(node.name!) || visitChildren(node.parameters));

        case ts.SyntaxKind.Constructor: 
            return visit(visitor.visitConstructor, node as ts.ConstructorDeclaration, node =>
                visitChildren(node.parameters));

        case ts.SyntaxKind.ClassDeclaration:
            return visit(visitor.visitClass, node as ts.ClassDeclaration, node =>
                visitChild(node.name!) || visitChildren(node.members));

        case ts.SyntaxKind.InterfaceDeclaration:
            return visit(visitor.visitInterface, node as ts.InterfaceDeclaration, node => 
                visitChild(node.name!) || visitChildren(node.members));

        case ts.SyntaxKind.ModuleDeclaration:
            return visit(visitor.visitNamespace, node as ts.ModuleDeclaration, node => 
                visitChild(node.name!) || visitChildren((node.body as ts.ModuleBlock).statements));

        case ts.SyntaxKind.Parameter: 
            return visit(visitor.visitParameter, node as ts.ParameterDeclaration, node => visitChild(node.name));

        case ts.SyntaxKind.Identifier:
            return visit(visitor.visitIdentifier, node);
            
        default:
            return visit(visitor.visitOtherNode, node);
    }    
} 
