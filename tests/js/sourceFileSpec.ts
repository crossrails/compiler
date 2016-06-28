import * as fs from 'fs';
import * as rewire from 'rewire';
import * as ts from "typescript";
import * as AST from "../../src/ast"
import {log} from "../../src/log"

let ast = rewire<typeof AST>('../../src/ast');

describe("SourceFile", () => {
    
    interface This {
        variableDeclarationConstructor: jasmine.Spy;            
    }
    
    beforeEach(function(this: This) {
        this.variableDeclarationConstructor = jasmine.createSpy('VariableDeclaration');
        ast.__set__('VariableDeclaration', this.variableDeclarationConstructor);
    });
    
    it("does not create non exported declarations when implicitExport option not specified", function(this: This) {
        let sourceFile = new ast.SourceFile(ts.createSourceFile('source.js', "let declaration", ts.ScriptTarget.ES6, true), false, {} as any, {} as any);
        expect(this.variableDeclarationConstructor).not.toHaveBeenCalled();
    });

    it("creates non exported declarations when implicitExport option specified", function(this: This) {
        let sourceFile = new ast.SourceFile(ts.createSourceFile('source.js', "let declaration", ts.ScriptTarget.ES6, true), true, {} as any, {} as any);
        expect(this.variableDeclarationConstructor).toHaveBeenCalledTimes(1);
    });

    it("creates variable declarations for each declaration in a variable statement", function(this: This) {
        let sourceFile = new ast.SourceFile(ts.createSourceFile('source.js', "export let a1, a2; export let b1;", ts.ScriptTarget.ES6, true), false, {} as any, {identifiers: new Set()} as any);
        expect(this.variableDeclarationConstructor).toHaveBeenCalledTimes(3);
    });
});
