"use strict";
(function (Action) {
    Action[Action["Break"] = 1] = "Break";
    Action[Action["Delete"] = 2] = "Delete";
})(exports.Action || (exports.Action = {}));
var Action = exports.Action;
function walk(node, walker) {
    visit(node, {
        beforeNode: function (node) {
            var action = walker.beforeNode && walker.beforeNode(node);
            visit(node.leadingComments, this);
            visit(node.trailingComments, this);
            return action;
        },
        afterNode: function (node) {
            return walker.afterNode && walker.afterNode(node);
        },
        beforeStatement: function (node) {
            return walker.beforeStatement && walker.beforeStatement(node);
        },
        afterStatement: function (node) {
            return walker.afterStatement && walker.afterStatement(node);
        },
        beforeDeclaration: function (node) {
            return walker.beforeDeclaration && walker.beforeDeclaration(node);
        },
        afterDeclaration: function (node) {
            return walker.afterDeclaration && walker.afterDeclaration(node);
        },
        beforePattern: function (node) {
            return walker.beforePattern && walker.beforePattern(node);
        },
        afterPattern: function (node) {
            return walker.afterPattern && walker.afterPattern(node);
        },
        beforeExpression: function (node) {
            return walker.beforeExpression && walker.beforeExpression(node);
        },
        afterExpression: function (node) {
            return walker.afterExpression && walker.afterExpression(node);
        },
        beforeFunction: function (node) {
            var action = walker.beforeFunction && walker.beforeFunction(node);
            visit(node.id, this);
            visit(node.params, this);
            visit(node.body, this);
            return action;
        },
        afterFunction: function (node) {
            return walker.afterFunction && walker.afterFunction(node);
        },
        beforeClass: function (node) {
            var action = walker.beforeClass && walker.beforeClass(node);
            visit(node.id, this);
            visit(node.superClass, this);
            visit(node.body, this);
            return action;
        },
        afterClass: function (node) {
            return walker.afterClass && walker.afterClass(node);
        },
        onProgram: function (node) {
            var action = walker.onProgram && walker.onProgram(node);
            visit(node.body, this);
            visit(node.comments, this);
            return action;
        },
        onClassDeclaration: function (node) {
            return walker.onClassDeclaration && walker.onClassDeclaration(node);
        },
        onFunctionDeclaration: function (node) {
            return walker.onFunctionDeclaration && walker.onFunctionDeclaration(node);
        },
        onVariableDeclaration: function (node) {
            var action = walker.onVariableDeclaration && walker.onVariableDeclaration(node);
            visit(node.declarations, this);
            return action;
        },
        onVariableDeclarator: function (node) {
            var action = walker.onVariableDeclarator && walker.onVariableDeclarator(node);
            visit(node.id, this);
            visit(node.init, this);
            return action;
        },
        onIdentifier: function (node) {
            return walker.onIdentifier && walker.onIdentifier(node);
        },
        onLiteral: function (node) {
            return walker.onLiteral && walker.onLiteral(node);
        },
        onClassBody: function (node) {
            var action = walker.onClassBody && walker.onClassBody(node);
            visit(node.body, this);
            return action;
        },
        onComment: function (node) {
            return walker.onComment && walker.onComment(node);
        },
        onBlock: function (node) {
            return this.onComment(node);
        },
        onLine: function (node) {
            return this.onComment(node);
        },
        onBlockStatement: function (node) {
            var action = walker.onBlockStatement && walker.onBlockStatement(node);
            visit(node.body, this);
            return action;
        },
        onExpressionStatement: function (node) {
            var action = walker.onExpressionStatement && walker.onExpressionStatement(node);
            visit(node.expression, this);
            return action;
        },
        onMethodDefinition: function (node) {
            var action = walker.onMethodDefinition && walker.onMethodDefinition(node);
            visit(node.key, this);
            visit(node.value, this);
            return action;
        }
    });
}
exports.walk = walk;
function visit(node, visitor) {
    if (node instanceof Array) {
        for (var i = 0; i < node.length; i++) {
            visit(node[i], visitor) == Action.Delete && node.splice(i--, 1);
        }
    }
    else if (node) {
        return before(node, visitor) || visitor[("on" + node.type)](node) || after(node, visitor);
    }
}
function before(node, visitor) {
    switch (node.type) {
        case "Block":
        case "Line":
        case "Program":
        case "ClassBody":
        case "VariableDeclarator":
        case "MethodDefinition":
            return visitor.beforeNode(node);
        case "Literal":
            return visitor.beforeNode(node) ||
                visitor.beforeExpression(node);
        case "Identifier":
            return visitor.beforeNode(node) ||
                visitor.beforePattern(node);
        case "BlockStatement":
        case "ExpressionStatement":
            return visitor.beforeNode(node) ||
                visitor.beforeStatement(node);
        case "FunctionDeclaration":
            return visitor.beforeNode(node) ||
                visitor.beforeStatement(node) ||
                visitor.beforeDeclaration(node) ||
                visitor.beforeFunction(node);
        case "ClassDeclaration":
            return visitor.beforeNode(node) ||
                visitor.beforeStatement(node) ||
                visitor.beforeDeclaration(node) ||
                visitor.beforeClass(node);
        case "VariableDeclaration":
            return visitor.beforeNode(node) ||
                visitor.beforeStatement(node) ||
                visitor.beforeDeclaration(node);
        default:
            throw new Error("Not yet supported node type '" + node.type + "', time to submit a pull request!");
    }
}
function after(node, visitor) {
    switch (node.type) {
        case "Block":
        case "Line":
        case "Program":
        case "ClassBody":
        case "VariableDeclarator":
        case "MethodDefinition":
            return visitor.afterNode(node);
        case "Literal":
            return visitor.afterExpression(node) ||
                visitor.afterNode(node);
        case "Identifier":
            return visitor.afterPattern(node) ||
                visitor.afterNode(node);
        case "BlockStatement":
        case "ExpressionStatement":
            return visitor.afterStatement(node) ||
                visitor.afterNode(node);
        case "FunctionDeclaration":
            return visitor.afterFunction(node) ||
                visitor.afterDeclaration(node) ||
                visitor.afterStatement(node) ||
                visitor.afterNode(node);
        case "ClassDeclaration":
            return visitor.afterClass(node) ||
                visitor.afterDeclaration(node) ||
                visitor.afterStatement(node) ||
                visitor.afterNode(node);
        case "VariableDeclaration":
            return visitor.afterDeclaration(node) ||
                visitor.afterStatement(node) ||
                visitor.afterNode(node);
        default:
            throw new Error("Not yet supported node type '" + node.type + "', time to submit a pull request!");
    }
}
//# sourceMappingURL=estree-visitor.js.map