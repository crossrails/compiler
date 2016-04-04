import {readFileSync} from 'fs';
import * as esprima from 'esprima';
//import * as doctrine from 'doctrine';
import * as ESTree from './estree-visitor';

let program = esprima.parse(readFileSync(process.argv[2]).toString(), {
    tolerant: true,
    attachComment: true
});

ESTree.walk(program, {
    beforeNode(node) {
        delete node.loc;
        delete node.range;
    },
    beforeDeclaration(node) {
        node.leadingComments && node.leadingComments.splice(0, node.leadingComments.length - 1);
        delete node.trailingComments;
    },
    beforeFunction(node) {
        delete node.body;
    },
    onProgram(node) {
        delete node.comments;
        delete node.errors;
    },
    onVariableDeclarator(node) {
        delete node.init;
        return ESTree.Action.Break;
    },
    onMethodDefinition(node) {
        delete node.value;
        return ESTree.Action.Break;
    },
    onIdentifier() {
        return ESTree.Action.Break;
    },
    onComment() {
        return ESTree.Action.Break;
    },
    afterDeclaration() {
        return ESTree.Action.Break;
    },
    afterNode() {
        return ESTree.Action.Delete;
    }
});

console.log(JSON.stringify(program, null, 4))
