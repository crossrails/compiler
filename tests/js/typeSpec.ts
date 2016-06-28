import * as fs from 'fs';
import * as rewire from 'rewire';
import * as ts from "typescript";
import * as AST from "../../src/ast"
import {log} from "../../src/log"

let ast = rewire<typeof AST>('../../src/ast');

describe("Type", () => {
    
    interface This {
        anyTypeConstructor: jasmine.Spy;            
        stringTypeConstructor: jasmine.Spy;            
        booleanTypeConstructor: jasmine.Spy;            
        numberTypeConstructor: jasmine.Spy;            
        errorTypeConstructor: jasmine.Spy;            
    }
    
    beforeEach(function(this: This) {
        this.anyTypeConstructor = jasmine.createSpy('AnyType');
        ast.__set__('AnyType', this.anyTypeConstructor);
        this.stringTypeConstructor = jasmine.createSpy('StringType');
        ast.__set__('StringType', this.stringTypeConstructor);
        this.booleanTypeConstructor = jasmine.createSpy('BooleanType');
        ast.__set__('BooleanType', this.booleanTypeConstructor);
        this.numberTypeConstructor = jasmine.createSpy('NumberType');
        ast.__set__('NumberType', this.numberTypeConstructor);
        this.errorTypeConstructor = jasmine.createSpy('ErrorType');
        ast.__set__('ErrorType', this.errorTypeConstructor);
        log.resetCounters();
    });

    it("erases to any on typescript intersection types", function(this: This) {
        let context = {identifiers: new Set(), queue: [], typeDeclarations: new Map()};
        let sourceFile = new ast.SourceFile(ts.createSourceFile('source.ts', `export let s: string & number`, ts.ScriptTarget.ES6, true,), false, {} as any, context as any);
        expect(this.anyTypeConstructor).toHaveBeenCalledTimes(1);
        expect(this.anyTypeConstructor).toHaveBeenCalledWith(false, jasmine.objectContaining({name: 's'}));
    });  
    
    it("erases to any on unsupported typescript union types", function(this: This) {
        let context = {identifiers: new Set(), queue: [], typeDeclarations: new Map()};
        let sourceFile = new ast.SourceFile(ts.createSourceFile('source.ts', `export let s: string | number`, ts.ScriptTarget.ES6, true), false, {} as any, context as any);
        expect(this.anyTypeConstructor).toHaveBeenCalledTimes(1);
        expect(this.anyTypeConstructor).toHaveBeenCalledWith(false, jasmine.objectContaining({name: 's'}));
    });    

    it("correctly identifies typescript optional types", function(this: This) {
        let context = {identifiers: new Set(), queue: [], typeDeclarations: new Map()};
        let sourceFile = new ast.SourceFile(ts.createSourceFile('source.ts', `
            export let a: any | null;
            export let b: null | any;
            export let c: any | undefined;
            export let d: undefined | any;
        `, ts.ScriptTarget.ES6, true), false, {} as any, context as any);
        expect(this.anyTypeConstructor).toHaveBeenCalledTimes(4);
        expect(this.anyTypeConstructor).not.toHaveBeenCalledWith(false);
    });
    
    it("correctly identifies typescript function types", function(this: This) {
        let context = {identifiers: new Set(), queue: [], typeDeclarations: new Map()};
        let sourceFile = new ast.SourceFile(ts.createSourceFile('source.ts', `
            export let run: () => void;
            export let supplier: () => ReturnValue;
            export let consumer: (n :Arg) => void;
        `, ts.ScriptTarget.ES6, true), false, {} as any, context as any);
        context.queue.forEach(f => f())
        let run = (sourceFile.declarations[0] as AST.VariableDeclaration).type as AST.FunctionType;
        expect(run.constructor.name).toBe('FunctionType');
        expect(run.signature.returnType.constructor.name).toBe('VoidType');
        expect(run.signature.parameters.length).toBe(0);
        let supplier = (sourceFile.declarations[1] as AST.VariableDeclaration).type as AST.FunctionType;
        expect(supplier.constructor.name).toBe('FunctionType');
        expect(supplier.signature.returnType.constructor.name).toBe('DeclaredType');
        expect((supplier.signature.returnType as AST.DeclaredType).name).toBe('ReturnValue');
        expect(run.signature.parameters.length).toBe(0);
        let consumer = (sourceFile.declarations[2] as AST.VariableDeclaration).type as AST.FunctionType;
        expect(consumer.constructor.name).toBe('FunctionType');
        expect(consumer.signature.returnType.constructor.name).toBe('VoidType');
        expect(consumer.signature.parameters.length).toBe(1);
        expect(consumer.signature.parameters[0].type.constructor.name).toBe('DeclaredType');
        expect((consumer.signature.parameters[0].type as AST.DeclaredType).name).toBe('Arg');
    });
    
    it("correctly identifies typescript array types", function(this: This) {
        let context = {identifiers: new Set(), queue: [], typeDeclarations: new Map()};
        let sourceFile = new ast.SourceFile(ts.createSourceFile('source.ts', `
            export let numbers: number[];
            export let strings: Array<string>;
            export let booleans: ReadonlyArray<boolean>;
        `, ts.ScriptTarget.ES6, true), false, {} as any, context as any);
        //let numbers: number[]
        expect(this.numberTypeConstructor).toHaveBeenCalledTimes(1);
        expect(this.numberTypeConstructor).toHaveBeenCalledWith(false, jasmine.objectContaining({name: 'numbers'}));
        expect((sourceFile.declarations[0] as AST.VariableDeclaration).type.constructor.name).toBe('ArrayType');
        //let strings: Array<string>
        expect(this.stringTypeConstructor).toHaveBeenCalledTimes(1);
        expect(this.stringTypeConstructor).toHaveBeenCalledWith(false, jasmine.objectContaining({name: 'strings'}));
        expect((sourceFile.declarations[1] as AST.VariableDeclaration).type.constructor.name).toBe('ArrayType');
        //let booleans: ReadonlyArray<boolean>
        expect(this.booleanTypeConstructor).toHaveBeenCalledTimes(1);
        expect(this.booleanTypeConstructor).toHaveBeenCalledWith(false, jasmine.objectContaining({name: 'booleans'}));
        expect((sourceFile.declarations[2] as AST.VariableDeclaration).type.constructor.name).toBe('ArrayType');
    });    
    
    it("correctly identifies typescript basic types", function(this: This) {
        let context = {identifiers: new Set(), queue: [], typeDeclarations: new Map()};
        let sourceFile = new ast.SourceFile(ts.createSourceFile('source.ts', `
            export let s: string;
            export let b: boolean;
            export let n: number;
            export let a: any;
            export let e: Error;
        `, ts.ScriptTarget.ES6, true), false, {} as any, context as any);
        //let s: string
        expect(this.stringTypeConstructor).toHaveBeenCalledTimes(1);
        expect(this.stringTypeConstructor).toHaveBeenCalledWith(false, jasmine.objectContaining({name: 's'}));
        //let b: boolean
        expect(this.booleanTypeConstructor).toHaveBeenCalledTimes(1);
        expect(this.booleanTypeConstructor).toHaveBeenCalledWith(false, jasmine.objectContaining({name: 'b'}));
        //let n: number
        expect(this.numberTypeConstructor).toHaveBeenCalledTimes(1);
        expect(this.numberTypeConstructor).toHaveBeenCalledWith(false, jasmine.objectContaining({name: 'n'}));
        // let a: any
        expect(this.anyTypeConstructor).toHaveBeenCalledTimes(1);
        expect(this.anyTypeConstructor).toHaveBeenCalledWith(false, jasmine.objectContaining({name: 'a'}));
        // let e: Error
        expect(this.errorTypeConstructor).toHaveBeenCalledTimes(1);
        expect(this.errorTypeConstructor).toHaveBeenCalledWith(false, jasmine.objectContaining({name: 'e'}));
    });

    it("correctly identifies typescript declared types and links the declaration", function(this: This) {
        let context = {identifiers: new Set(), queue: [], typeDeclarations: new Map()};
        let sourceFile = new ast.SourceFile(ts.createSourceFile('source.ts', `export interface Custom {}; export let c: Custom`, ts.ScriptTarget.ES6, true), false, {} as any, context as any);
        context.queue.forEach(f => f())
        expect(log.errorCount).toBe(0);
        expect((sourceFile.declarations[1] as AST.VariableDeclaration).type.constructor.name).toBe('DeclaredType');
        let type = (sourceFile.declarations[1] as AST.VariableDeclaration).type as AST.DeclaredType;
        expect(type.declaration).toBe(sourceFile.declarations[0]);
    });

    it("errors when an typescript undeclared type is referenced", function(this: This) {
        let context = {identifiers: new Set(), queue: [], typeDeclarations: new Map()};
        let sourceFile = new ast.SourceFile(ts.createSourceFile('source.ts', `export let c: Custom`, ts.ScriptTarget.ES6, true), false, {} as any, context as any);
        context.queue.forEach(f => f())
        expect(log.errorCount).toBe(1);
    });

});
