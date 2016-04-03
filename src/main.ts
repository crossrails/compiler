import {readFileSync} from 'fs';
import * as esprima from 'esprima';
import * as doctrine from 'doctrine';
import * as ESTree from './estree-visitor';

let program = esprima.parse(readFileSync(process.argv[2]).toString(), {
    tolerant: true,
    attachComment: true
});

ESTree.visit(program, {
    beforeNode(node) {
        delete node.loc;
        delete node.range;       
    }, 
    afterNode(node) {
        return ESTree.Action.Delete;
    },
    onProgram(program) {
        delete program.comments;
        delete program.errors;
    },
    onVariableDeclaration(variable) {
        variable.leadingComments.splice(0, variable.leadingComments.length - 1);
        delete variable.trailingComments;
        return ESTree.Action.Break;
    }    
});

console.log(JSON.stringify(program, null, 4))
