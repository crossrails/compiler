export enum Action {
    Break,
    Delete
}

export interface Visitor {
    beforeNode?(node: ESTree.Node): Action | void
    afterNode?(node: ESTree.Node): Action | void
    beforeStatement?(statement: ESTree.Statement): Action | void
    afterStatement?(statement: ESTree.Statement): Action | void
    beforeDeclaration?(declaration: ESTree.Declaration): Action | void
    afterDeclaration?(declaration: ESTree.Declaration): Action | void
    onProgram?(program: ESTree.Program): Action | void
    onVariableDeclaration?(declaration: ESTree.VariableDeclaration): Action | void
}

export function visit<T>(node: ESTree.Node | Array<ESTree.Node>, visitor: Visitor) {
    if(node instanceof Array) {
        node.forEach((node, index, body) => {
            visit(node, visitor) == Action.Delete && body.splice(index, 1);                    
        });        
    } else if(node) {
        let action = visitor.beforeNode && visitor.beforeNode(node);
        visit(node.leadingComments, visitor);
        visit(node.trailingComments, visitor);
        switch(node.type) {
            case "Program": 
                let program = node as ESTree.Program;
                action = action || visitor.onProgram && visitor.onProgram(program);
                visit(program.body, visitor)
                visit(program.comments, visitor)
                break;           
            case "VariableDeclaration": 
                let statement = node as ESTree.Statement
                action = action || visitor.beforeStatement && visitor.beforeStatement(statement);
                switch(node.type) {
                    case "VariableDeclaration": {
                        let declaration = statement as ESTree.Declaration;
                        action = action || visitor.beforeDeclaration && visitor.beforeDeclaration(declaration);
                        switch(node.type) {
                            case "VariableDeclaration":
                                let variable = statement as ESTree.VariableDeclaration
                                action = action || visitor.onVariableDeclaration(variable)
                                visit(variable.declarations, visitor);
                                break;
                        }
                        action = action || visitor.afterDeclaration && visitor.afterDeclaration(declaration);
                        break;
                    }
                }
                action = action || visitor.afterStatement && visitor.afterStatement(statement);
                break;
        }
        return action || visitor.afterNode && visitor.afterNode(node)
    }
}