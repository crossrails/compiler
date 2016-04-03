"use strict";
var fs_1 = require('fs');
var esprima = require('esprima');
var ESTree = require('./estree-visitor');
var program = esprima.parse(fs_1.readFileSync(process.argv[2]).toString(), {
    tolerant: true,
    attachComment: true
});
ESTree.visit(program, {
    beforeNode: function (node) {
        delete node.loc;
        delete node.range;
    },
    afterNode: function (node) {
        return ESTree.Action.Delete;
    },
    onProgram: function (program) {
        delete program.comments;
        delete program.errors;
    },
    onVariableDeclaration: function (variable) {
        variable.leadingComments.splice(0, variable.leadingComments.length - 1);
        delete variable.trailingComments;
        return ESTree.Action.Break;
    }
});
console.log(JSON.stringify(program, null, 4));
//# sourceMappingURL=main.js.map