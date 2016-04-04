export enum Action {
    Break = 1,
    Delete
}

export interface Walker {
    beforeNode?(node: ESTree.Node): Action | void
    afterNode?(node: ESTree.Node): Action | void
    beforeStatement?(node: ESTree.Statement): Action | void
    afterStatement?(node: ESTree.Statement): Action | void
    beforeDeclaration?(node: ESTree.Declaration): Action | void
    afterDeclaration?(node: ESTree.Declaration): Action | void
    beforePattern?(node: ESTree.Pattern): Action | void
    afterPattern?(node: ESTree.Pattern): Action | void
    beforeExpression?(node: ESTree.Expression): Action | void
    afterExpression?(node: ESTree.Expression): Action | void
    beforeFunction?(node: ESTree.Function): Action | void
    afterFunction?(node: ESTree.Function): Action | void
    beforeClass?(node: ESTree.Class): Action | void
    afterClass?(node: ESTree.Class): Action | void
    onProgram?(node: ESTree.Program): Action | void
    onVariableDeclaration?(node: ESTree.VariableDeclaration): Action | void
    onVariableDeclarator?(node: ESTree.VariableDeclarator): Action | void
    onFunctionDeclaration?(node: ESTree.FunctionDeclaration): Action | void
    onClassDeclaration?(node: ESTree.ClassDeclaration): Action | void
    onClassBody?(node: ESTree.ClassBody): Action | void
    onIdentifier?(node: ESTree.Identifier): Action | void
    onLiteral?(node: ESTree.Literal): Action | void
    onComment?(node: ESTree.Comment): Action | void
    onBlockStatement?(node: ESTree.BlockStatement): Action | void
    onExpressionStatement?(node: ESTree.ExpressionStatement): Action | void
    onMethodDefinition?(node: ESTree.MethodDefinition): Action | void
}

export function walk(node: ESTree.Node | Array<ESTree.Node>, walker: Walker) {
    visit(node, {
        beforeNode(node: ESTree.Node): Action | void {
            let action =  walker.beforeNode && walker.beforeNode(node);
            visit(node.leadingComments, this);
            visit(node.trailingComments, this);
            return action;
        },
        afterNode(node: ESTree.Node): Action | void {
            return walker.afterNode && walker.afterNode(node);
        },
        beforeStatement(node: ESTree.Statement): Action | void {
            return walker.beforeStatement && walker.beforeStatement(node);
        },
        afterStatement(node: ESTree.Statement): Action | void {
            return walker.afterStatement && walker.afterStatement(node);
        },
        beforeDeclaration(node: ESTree.Declaration): Action | void {
            return walker.beforeDeclaration && walker.beforeDeclaration(node);
        },
        afterDeclaration(node: ESTree.Declaration): Action | void {
            return walker.afterDeclaration && walker.afterDeclaration(node);
        },
        beforePattern(node: ESTree.Pattern): Action | void {
            return walker.beforePattern && walker.beforePattern(node);
        },
        afterPattern(node: ESTree.Pattern): Action | void {
            return walker.afterPattern && walker.afterPattern(node);
        },
        beforeExpression(node: ESTree.Expression): Action | void {
            return walker.beforeExpression && walker.beforeExpression(node);
        },
        afterExpression(node: ESTree.Expression): Action | void {
            return walker.afterExpression && walker.afterExpression(node);
        },
        beforeFunction(node: ESTree.Function): Action | void {
            let action = walker.beforeFunction && walker.beforeFunction(node);
            visit(node.id, this);
            visit(node.params, this);
            visit(node.body, this);
            return action;
        },
        afterFunction(node: ESTree.Function): Action | void {
            return walker.afterFunction && walker.afterFunction(node);
        },
        beforeClass(node: ESTree.Class): Action | void {
            let action = walker.beforeClass && walker.beforeClass(node);
            visit(node.id, this);
            visit(node.superClass, this);
            visit(node.body, this);
            return action;
        },
        afterClass(node: ESTree.Class): Action | void {
            return walker.afterClass && walker.afterClass(node);
        },
        onProgram(node: ESTree.Program): Action | void {
            let action = walker.onProgram && walker.onProgram(node)
            visit(node.body, this);
            visit(node.comments, this);
            return action;
        },
        onClassDeclaration(node: ESTree.ClassDeclaration): Action | void {
            return walker.onClassDeclaration && walker.onClassDeclaration(node);
        },
        onFunctionDeclaration(node: ESTree.FunctionDeclaration): Action | void {
            return walker.onFunctionDeclaration && walker.onFunctionDeclaration(node);
        },
        onVariableDeclaration(node: ESTree.VariableDeclaration): Action | void {
            let action = walker.onVariableDeclaration && walker.onVariableDeclaration(node);
            visit(node.declarations, this);
            return action;
        },
        onVariableDeclarator(node: ESTree.VariableDeclarator): Action | void {
            let action = walker.onVariableDeclarator && walker.onVariableDeclarator(node);
            visit(node.id, this);
            visit(node.init, this);
            return action;
        },
        onIdentifier(node: ESTree.Identifier): Action | void {
            return walker.onIdentifier && walker.onIdentifier(node);
        },
        onLiteral(node: ESTree.Literal): Action | void {
            return walker.onLiteral && walker.onLiteral(node);
        },
        onClassBody(node: ESTree.ClassBody): Action | void {
            let action = walker.onClassBody && walker.onClassBody(node);
            visit(node.body, this);
            return action;
        },
        onComment(node: ESTree.Comment): Action | void {
            return walker.onComment && walker.onComment(node);
        },
        onBlock(node) {
            return this.onComment(node);
        },
        onLine(node) {
            return this.onComment(node);
        },
        onBlockStatement(node) {
            let action = walker.onBlockStatement && walker.onBlockStatement(node);
            visit(node.body, this);
            return action;
        },
        onExpressionStatement(node) {
            let action = walker.onExpressionStatement && walker.onExpressionStatement(node);
            visit(node.expression, this);
            return action;
        },
        onMethodDefinition(node) {
            let action = walker.onMethodDefinition && walker.onMethodDefinition(node);
            visit(node.key, this);
            visit(node.value, this);
            return action;
        }
    });
}

interface Visitor extends Walker {
    [method: string]: (node: ESTree.Node) => Action | void;
    onBlock(node: ESTree.Comment): Action | void
    onLine(node: ESTree.Comment): Action | void
}

function visit(node: ESTree.Node | Array<ESTree.Node> | undefined, visitor: Visitor): Action | void {
    if(node instanceof Array) {
        for (let i = 0; i < node.length; i++) {
            visit(node[i], visitor) == Action.Delete && node.splice(i--, 1);
        }
    } else if(node) {
        return before(node, visitor) || visitor[`on${node.type}`](node) || after(node, visitor);
    }
}

function before(node: ESTree.Node, visitor: Visitor): Action | void {
    switch(node.type) {
        case "Block":
        case "Line":
        case "Program":
        case "ClassBody":
        case "VariableDeclarator":
        case "MethodDefinition":
            return visitor.beforeNode(node);
        case "Literal":
            return visitor.beforeNode(node) || 
                visitor.beforeExpression(node as ESTree.Expression);
        case "Identifier":
            return visitor.beforeNode(node) ||
                visitor.beforePattern(node as ESTree.Pattern);
        case "BlockStatement":
        case "ExpressionStatement":
            return visitor.beforeNode(node) ||
                visitor.beforeStatement(node as ESTree.Statement);
        case "FunctionDeclaration":
            return visitor.beforeNode(node) ||
                visitor.beforeStatement(node as ESTree.Statement) ||
                visitor.beforeDeclaration(node as ESTree.Declaration) ||
                visitor.beforeFunction(node as ESTree.Function);
        case "ClassDeclaration":
            return visitor.beforeNode(node) ||
                visitor.beforeStatement(node as ESTree.Statement) ||
                visitor.beforeDeclaration(node as ESTree.Declaration) ||
                visitor.beforeClass(node as ESTree.Class);
        case "VariableDeclaration":
            return visitor.beforeNode(node) ||
                visitor.beforeStatement(node as ESTree.Statement) ||
                visitor.beforeDeclaration(node as ESTree.Declaration);
        default:
            throw new Error(`Not yet supported node type '${node.type}', time to submit a pull request!`);
    }
}

function after(node: ESTree.Node, visitor: Visitor): Action | void {
    switch(node.type) {
        case "Block":
        case "Line":
        case "Program":
        case "ClassBody":
        case "VariableDeclarator":
        case "MethodDefinition":
            return visitor.afterNode(node);
        case "Literal":
            return visitor.afterExpression(node as ESTree.Expression) ||
                visitor.afterNode(node);
        case "Identifier":
            return visitor.afterPattern(node as ESTree.Pattern) ||
                visitor.afterNode(node);
        case "BlockStatement":
        case "ExpressionStatement":
            return visitor.afterStatement(node as ESTree.Statement) ||
                visitor.afterNode(node);
        case "FunctionDeclaration":
            return visitor.afterFunction(node as ESTree.Function) ||
                visitor.afterDeclaration(node as ESTree.Declaration) ||
                visitor.afterStatement(node as ESTree.Statement) ||
                visitor.afterNode(node)
        case "ClassDeclaration":
            return visitor.afterClass(node as ESTree.Class) ||
                visitor.afterDeclaration(node as ESTree.Declaration) ||
                visitor.afterStatement(node as ESTree.Statement) ||
                visitor.afterNode(node)
        case "VariableDeclaration":
            return visitor.afterDeclaration(node as ESTree.Declaration) ||
                visitor.afterStatement(node as ESTree.Statement) ||
                visitor.afterNode(node)
        default:
            throw new Error(`Not yet supported node type '${node.type}', time to submit a pull request!`);
    }
}
