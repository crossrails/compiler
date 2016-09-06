// import * as fs from 'fs';
// import * as rewire from 'rewire';
// import * as ts from "typescript";
// import * as AST from "../../../src/ast"
// import {TypeScriptParser} from "../../../src/typescript/parser"
// import {log, Log} from "../../../src/log"
// import {mockProgram} from "./mocks"

// describe("Parser", () => {
    
//     interface This {
//         ast: typeof AST & rewire.Rewire;
//         createProgramMethod: jasmine.Spy;             
//         variableDeclarationConstructor: jasmine.Spy;            
//     }
    
//     beforeEach(function(this: This) {
//         this.ast = rewire<typeof AST>('../../../src/ast');
//         this.variableDeclarationConstructor = jasmine.createSpy('VariableDeclaration');
//         this.ast.__set__('VariableDeclaration', this.variableDeclarationConstructor);
//         this.createProgramMethod = spyOn(ts, 'createProgram').and.callThrough(); 
//         log.level = Log.Level.DEBUG;
//         log.resetCounters();
//     });
    

//     it("creates variable declarations for each declaration in a variable statement", function(this: This) {
//         let sourceFile = new this.ast.SourceFile(ts.createSourceFile('source.js', "export let a1, a2; export let b1;", ts.ScriptTarget.ES6, true), false, {} as any, new this.ast.Context(mockProgram([])));
//         expect(this.variableDeclarationConstructor).toHaveBeenCalledTimes(3);
//     });
// }