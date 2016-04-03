"use strict";
(function (Action) {
    Action[Action["Break"] = 0] = "Break";
    Action[Action["Delete"] = 1] = "Delete";
})(exports.Action || (exports.Action = {}));
var Action = exports.Action;
function visit(node, visitor) {
    if (node instanceof Array) {
        node.forEach(function (node, index, body) {
            visit(node, visitor) == Action.Delete && body.splice(index, 1);
        });
    }
    else if (node) {
        var action = visitor.beforeNode && visitor.beforeNode(node);
        visit(node.leadingComments, visitor);
        visit(node.trailingComments, visitor);
        switch (node.type) {
            case "Program":
                var program = node;
                action = action || visitor.onProgram && visitor.onProgram(program);
                visit(program.body, visitor);
                visit(program.comments, visitor);
                break;
            case "VariableDeclaration":
                var statement = node;
                action = action || visitor.beforeStatement && visitor.beforeStatement(statement);
                switch (node.type) {
                    case "VariableDeclaration": {
                        var declaration = statement;
                        action = action || visitor.beforeDeclaration && visitor.beforeDeclaration(declaration);
                        switch (node.type) {
                            case "VariableDeclaration":
                                var variable = statement;
                                action = action || visitor.onVariableDeclaration(variable);
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
        return action || visitor.afterNode && visitor.afterNode(node);
    }
}
exports.visit = visit;
//# sourceMappingURL=estree-visitor.js.map