import * as fs from 'fs';
import * as rewire from 'rewire';
import * as ts from "typescript";
import * as AST from "../../src/ast"
import {log} from "../../src/log"
import {mockProgram} from "./mocks"

describe("SourceFile", () => {
    
    interface This {
        ast: typeof AST & rewire.Rewire;
        variableDeclarationConstructor: jasmine.Spy;            
    }
    
    beforeEach(function(this: This) {
        this.ast = rewire<typeof AST>('../../src/ast');
        this.variableDeclarationConstructor = jasmine.createSpy('VariableDeclaration');
        this.ast.__set__('VariableDeclaration', this.variableDeclarationConstructor);
    });
    
    it("does not create non exported declarations when implicitExport option not specified", function(this: This) {
        let sourceFile = new this.ast.SourceFile(ts.createSourceFile('source.js', "let declaration", ts.ScriptTarget.ES6, true), false, {} as any, {} as any);
        expect(this.variableDeclarationConstructor).not.toHaveBeenCalled();
    });

    it("creates non exported declarations when implicitExport option specified", function(this: This) {
        let sourceFile = new this.ast.SourceFile(ts.createSourceFile('source.js', "let declaration", ts.ScriptTarget.ES6, true), true, {} as any, new this.ast.Context(mockProgram([])));
        expect(this.variableDeclarationConstructor).toHaveBeenCalledTimes(1);
    });

    it("creates variable declarations for each declaration in a variable statement", function(this: This) {
        let sourceFile = new this.ast.SourceFile(ts.createSourceFile('source.js', "export let a1, a2; export let b1;", ts.ScriptTarget.ES6, true), false, {} as any, new this.ast.Context(mockProgram([])));
        expect(this.variableDeclarationConstructor).toHaveBeenCalledTimes(3);
    });
});
