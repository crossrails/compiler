"use strict";
var fs_1 = require('fs');
var esprima = require('esprima');
//import * as doctrine from 'doctrine';
var ESTree = require('./estree-visitor');
var program = esprima.parse(fs_1.readFileSync(process.argv[2]).toString(), {
    tolerant: true,
    attachComment: true
});
ESTree.walk(program, {
    beforeNode: function (node) {
        delete node.loc;
        delete node.range;
    },
    beforeDeclaration: function (node) {
        node.leadingComments && node.leadingComments.splice(0, node.leadingComments.length - 1);
        delete node.trailingComments;
    },
    beforeFunction: function (node) {
        delete node.body;
    },
    onProgram: function (node) {
        delete node.comments;
        delete node.errors;
    },
    onVariableDeclarator: function (node) {
        delete node.init;
        return ESTree.Action.Break;
    },
    onMethodDefinition: function (node) {
        delete node.value;
        return ESTree.Action.Break;
    },
    onIdentifier: function () {
        return ESTree.Action.Break;
    },
    onComment: function () {
        return ESTree.Action.Break;
    },
    afterDeclaration: function () {
        return ESTree.Action.Break;
    },
    afterNode: function () {
        return ESTree.Action.Delete;
    }
});
console.log(JSON.stringify(program, null, 4));
//# sourceMappingURL=main.js.map