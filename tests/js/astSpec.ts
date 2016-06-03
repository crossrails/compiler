import * as fs from 'fs';
import * as rewire from 'rewire';
import * as ts from "typescript";
import * as AST from "../../src/ast"

let ast = rewire<typeof AST>('../../src/ast');

describe("Type", () => {
    
    interface This {
        anyTypeConstructor: jasmine.Spy;            
        stringTypeConstructor: jasmine.Spy;            
        booleanTypeConstructor: jasmine.Spy;            
        numberTypeConstructor: jasmine.Spy;            
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
    });

    it("erases to any on intersection types", function(this: This) {
        let sourceFile = new ast.SourceFile(ts.createSourceFile('source.ts', `export let s: string & number`, ts.ScriptTarget.ES6, true), {identifiers: new Set()} as any);
        expect(this.anyTypeConstructor).toHaveBeenCalledTimes(1);
        expect(this.anyTypeConstructor).toHaveBeenCalledWith(false);
    });  
    
    it("erases to any on unsupported union types", function(this: This) {
        let sourceFile = new ast.SourceFile(ts.createSourceFile('source.ts', `export let s: string | number`, ts.ScriptTarget.ES6, true), {identifiers: new Set()} as any);
        expect(this.anyTypeConstructor).toHaveBeenCalledTimes(1);
        expect(this.anyTypeConstructor).toHaveBeenCalledWith(false);
    });    

    it("correctly identifies optional types", function(this: This) {
        let sourceFile = new ast.SourceFile(ts.createSourceFile('source.ts', `
            export let a: any | null;
            export let b: null | any;
            export let c: any | undefined;
            export let d: undefined | any;
        `, ts.ScriptTarget.ES6, true), {identifiers: new Set()} as any);
        expect(this.anyTypeConstructor).toHaveBeenCalledTimes(4);
        expect(this.anyTypeConstructor).not.toHaveBeenCalledWith(false);
    });
    
    it("correctly identifies array types", function(this: This) {
        let sourceFile = new ast.SourceFile(ts.createSourceFile('source.ts', `
            export let numbers: number[];
            export let strings: Array<string>;
            export let booleans: ReadonlyArray<boolean>;
        `, ts.ScriptTarget.ES6, true), {identifiers: new Set()} as any);
        //let numbers: number[]
        // expect(this.numberTypeConstructor).toHaveBeenCalledTimes(1);
        // expect(this.numberTypeConstructor).toHaveBeenCalledWith(false);
        //let strings: Array<string>
        expect(this.stringTypeConstructor).toHaveBeenCalledTimes(1);
        expect(this.stringTypeConstructor).toHaveBeenCalledWith(false);
        //let booleans: ReadonlyArray<boolean>
        // expect(this.booleanTypeConstructor).toHaveBeenCalledTimes(1);
        // expect(this.booleanTypeConstructor).toHaveBeenCalledWith(false);
    });    
    
    it("correctly identifies basic types", function(this: This) {
        let sourceFile = new ast.SourceFile(ts.createSourceFile('source.ts', `
            export let s: string;
            export let b: boolean;
            export let n: number;
            export let a: any;
        `, ts.ScriptTarget.ES6, true), {identifiers: new Set()} as any);
        //let s: string
        expect(this.stringTypeConstructor).toHaveBeenCalledTimes(1);
        expect(this.stringTypeConstructor).toHaveBeenCalledWith(false);
        //let b: boolean
        expect(this.booleanTypeConstructor).toHaveBeenCalledTimes(1);
        expect(this.booleanTypeConstructor).toHaveBeenCalledWith(false);
        //let n: number
        expect(this.numberTypeConstructor).toHaveBeenCalledTimes(1);
        expect(this.numberTypeConstructor).toHaveBeenCalledWith(false);
        // let a: any
        expect(this.anyTypeConstructor).toHaveBeenCalledTimes(1);
        expect(this.anyTypeConstructor).toHaveBeenCalledWith(false);
    });
});

describe("VariableDeclaration", () => {
    
    interface This {
        typeOfMethod: jasmine.Spy;            
        anyTypeConstructor: jasmine.Spy;            
    }
    
    beforeEach(function(this: This) {
        this.typeOfMethod = jasmine.createSpy('Type.of');
        ast.__set__('Type.from', this.typeOfMethod);
        this.anyTypeConstructor = jasmine.createSpy('AnyType');
        ast.__set__('AnyType', this.anyTypeConstructor);
    });
    
    it("has an any type when missing type information", function(this: This) {
        let sourceFile = new ast.SourceFile(ts.createSourceFile('source.js', "export let declaration", ts.ScriptTarget.ES6, true), {identifiers: new Set()} as any);
        expect(this.anyTypeConstructor).toHaveBeenCalledTimes(1);
    });

    it("retains type information when specified in the source", function(this: This) {
        let sourceFile = new ast.SourceFile(ts.createSourceFile('source.ts', "export let declaration: string;", ts.ScriptTarget.ES6, true), {identifiers: new Set()} as any);
        expect(this.typeOfMethod).toHaveBeenCalledTimes(1);
    });
});

describe("SourceFile", () => {
    
    interface This {
        variableDeclarationConstructor: jasmine.Spy;            
    }
    
    beforeEach(function(this: This) {
        this.variableDeclarationConstructor = jasmine.createSpy('VariableDeclaration');
        ast.__set__('VariableDeclaration', this.variableDeclarationConstructor);
    });
    
    it("does not create non exported declarations", function(this: This) {
        let sourceFile = new ast.SourceFile(ts.createSourceFile('source.js', "let declaration", ts.ScriptTarget.ES6, true), {} as any);
        expect(this.variableDeclarationConstructor).not.toHaveBeenCalled();
    });

    it("creates variable declarations for each declaration in a variable statement", function(this: This) {
        let sourceFile = new ast.SourceFile(ts.createSourceFile('source.js', "export let a1, a2; export let b1;", ts.ScriptTarget.ES6, true), {identifiers: new Set()} as any);
        expect(this.variableDeclarationConstructor).toHaveBeenCalledTimes(3);
    });
});

describe("Module", () => {
    
    interface This {
        readFileMethod: jasmine.Spy;            
        createSourceFileMethod: jasmine.Spy;            
    }
    
    beforeEach(function(this: This) {
        this.readFileMethod = spyOn(fs, 'readFileSync');
        this.createSourceFileMethod = spyOn(ts, 'createSourceFile').and.callThrough();
    });
    
    it("throws file not found when module source file does not exist", function(this: This) {
        this.readFileMethod.and.callThrough();
        try {
            let module = new ast.Module("missingfile.js", "utf8");
            fail("Did not throw exception");
        } catch(error) {
            expect(error.code).toBe('ENOENT');
        }
    });

    it("parses the supplied file if source map not found", function(this: This) {
        this.readFileMethod.and.callFake((file: string) => {
            if(file == 'src.js.map') throw new Error();
            return "";    
        });
        let module = new ast.Module("src.js", "utf8");
        expect(this.createSourceFileMethod).toHaveBeenCalledTimes(1)
        expect(this.createSourceFileMethod).toHaveBeenCalledWith("src.js", "", jasmine.anything(), jasmine.anything());
    });

    it("parses the files specified in the source map if found", function(this: This) {
        this.readFileMethod.and.callFake((file: string) => {
            return file != 'transpiled.js.map' ? '' : '{"sourceRoot": "", "sources": ["source1.ts", "source2.ts"]}';    
        });
        let module = new ast.Module("transpiled.js", "utf8");
        expect(this.createSourceFileMethod).toHaveBeenCalledTimes(2)
        expect(this.createSourceFileMethod).toHaveBeenCalledWith("source1.ts", "", jasmine.anything(), jasmine.anything());
        expect(this.createSourceFileMethod).toHaveBeenCalledWith("source2.ts", "", jasmine.anything(), jasmine.anything());
    });

    it("retains a source file if it contains exported declarations", function(this: This) {
        this.createSourceFileMethod.and.callThrough();
        this.readFileMethod.and.callFake((file: string) => {
            if(file == 'src.js.map') throw new Error();
            return "export let declaration";    
        });
        let module = new ast.Module("src.js", "utf8");
        expect(this.createSourceFileMethod).toHaveBeenCalledTimes(1);
        expect(module.files.length).toBe(1);
        expect(module.files[0].path.base).toBe("src.js");
    });
    
    it("does not retain a source file if it does not contains exported declarations", function(this: This) {
        this.createSourceFileMethod.and.callThrough();
        this.readFileMethod.and.callFake((file: string) => {
            if(file == 'src.js.map') throw new Error();
            return "let declaration";    
        });
        let module = new ast.Module("src.js", "utf8");
        expect(this.createSourceFileMethod).toHaveBeenCalledTimes(1);
        expect(module.files.length).toBe(0);
    });
});