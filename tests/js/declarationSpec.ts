import * as fs from 'fs';
import * as rewire from 'rewire';
import * as ts from "typescript";
import * as AST from "../../src/ast"
import {log} from "../../src/log"

describe("MemberDeclaration", () => {

    it("considers global declarations static", function() {
        let sourceFile = new AST.SourceFile(ts.createSourceFile('source.js', "export let declaration", ts.ScriptTarget.ES6, true), false, {} as any, {identifiers: new Set()} as any);
        expect((sourceFile.declarations[0] as AST.VariableDeclaration).static).toBe(true);
    });

});

describe("TypeDeclaration", () => {

    it("skips private member declarations", function() {
        let context = {identifiers: new Set(), queue: [], thrownTypes: new Set(), typeDeclarations: new Map()}
        let sourceFile = new AST.SourceFile(ts.createSourceFile('source.js', `
            export class MyClass {
                publicVar;
                private privateKeywordUsed;
                /**
                 * @private
                 */            
                privateTagUsed,
                /**
                 * @access private
                 */            
                accessTagUsed;
            }
        `, ts.ScriptTarget.ES6, true), false, {} as any, context as any);
        expect((sourceFile.declarations[0] as AST.TypeDeclaration).members.length).toBe(1);
    });

});

describe("FunctionDeclaration", () => {

    it("assumes void for return types and any for argument types when none specified", function() {
        let sourceFile = new AST.SourceFile(ts.createSourceFile('source.js', "export function myfunc(a) {}", ts.ScriptTarget.ES6, true), false, {} as any, {identifiers: new Set()} as any);
        let myfunc = sourceFile.declarations[0] as AST.FunctionDeclaration;
        expect(myfunc.signature.returnType.constructor.name).toBe('VoidType');
        expect(myfunc.signature.parameters[0].type.constructor.name).toBe('AnyType');
    });

    it("correctly parses throw tags from the jsdoc comment ", function() {
        let context = {identifiers: new Set(), queue: [], thrownTypes: new Set(), typeDeclarations: new Map()}
        let sourceFile = new AST.SourceFile(ts.createSourceFile('source.js', `
            export class BigError {}
            /**
             * @throws
             */            
            export function justThrows() {}
            /**
             * @throws {Error}
             */            
            export function throwsError() {}
            /**
             * @throws {BigError}
             * @throws {SmallError}
             */            
            export function throwsSeveral() {}
        `, ts.ScriptTarget.ES6, true), false, {} as any, context as any);
        context.queue.forEach(f => f())
        let justThrows = sourceFile.declarations[1] as AST.FunctionDeclaration;
        expect(justThrows.signature.thrownTypes.length).toBe(1);
        expect(justThrows.signature.thrownTypes[0].constructor.name).toBe('AnyType');
        let throwsError = sourceFile.declarations[2] as AST.FunctionDeclaration;
        expect(throwsError.signature.thrownTypes.length).toBe(1);
        expect(throwsError.signature.thrownTypes[0].constructor.name).toBe('ErrorType');
        let throwsSeveral = sourceFile.declarations[3] as AST.FunctionDeclaration;
        expect(throwsSeveral.signature.thrownTypes.length).toBe(2);
        expect(throwsSeveral.signature.thrownTypes[0].constructor.name).toBe('DeclaredType');
        expect(throwsSeveral.signature.thrownTypes[1].constructor.name).toBe('DeclaredType');
        let bigError =  sourceFile.declarations[0] as AST.ClassDeclaration;
        expect(bigError.isThrown).toBe(true);
    });
});

describe("VariableDeclaration", () => {
    
    interface This {
        ast: typeof AST & rewire.Rewire;
        typeOfMethod: jasmine.Spy;            
        anyTypeConstructor: jasmine.Spy;            
    }
    
    beforeEach(function(this: This) {
        this.ast = rewire<typeof AST>('../../src/ast');
        this.typeOfMethod = jasmine.createSpy('Type.of');
        this.ast.__set__('Type.from', this.typeOfMethod);
        this.anyTypeConstructor = jasmine.createSpy('AnyType');
        this.ast.__set__('AnyType', this.anyTypeConstructor);
    });
    
    it("has an any type when missing type information", function(this: This) {
        let sourceFile = new this.ast.SourceFile(ts.createSourceFile('source.js', "export let declaration", ts.ScriptTarget.ES6, true), false, {} as any, {identifiers: new Set()} as any);
        expect(this.anyTypeConstructor).toHaveBeenCalledTimes(1);
    });

    it("retains type information when specified in the source", function(this: This) {
        let sourceFile = new this.ast.SourceFile(ts.createSourceFile('source.ts', "export let declaration: string;", ts.ScriptTarget.ES6, true), false, {} as any, {identifiers: new Set()} as any);
        expect(this.typeOfMethod).toHaveBeenCalledTimes(1);
    });

});
