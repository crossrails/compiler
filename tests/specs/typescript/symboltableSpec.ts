import * as fs from 'fs';
import * as rewire from 'rewire';
import * as ts from "typescript";
import * as AST from "../../../src/ast"
import {log, Log} from "../../../src/log"
import {SymbolTable} from "../../../src/typescript/symboltable"
import {mockVariables, mockProgram} from "./mocks"

describe("SymbolTable", () => {
    
    interface This {
        // ast: typeof AST & rewire.Rewire;
        // anyTypeConstructor: jasmine.Spy;            
        // stringTypeConstructor: jasmine.Spy;            
        // booleanTypeConstructor: jasmine.Spy;            
        // numberTypeConstructor: jasmine.Spy;            
        // errorTypeConstructor: jasmine.Spy;            
    }
    
    beforeEach(function(this: This) {
        // this.ast = rewire<typeof AST>('../../../src/ast');
        // this.anyTypeConstructor = jasmine.createSpy('AnyType');
        // this.ast.__set__('AnyType', this.anyTypeConstructor);
        // this.stringTypeConstructor = jasmine.createSpy('StringType');
        // this.ast.__set__('StringType', this.stringTypeConstructor);
        // this.booleanTypeConstructor = jasmine.createSpy('BooleanType');
        // this.ast.__set__('BooleanType', this.booleanTypeConstructor);
        // this.numberTypeConstructor = jasmine.createSpy('NumberType');
        // this.ast.__set__('NumberType', this.numberTypeConstructor);
        // this.errorTypeConstructor = jasmine.createSpy('ErrorType');
        // this.ast.__set__('ErrorType', this.errorTypeConstructor);
        log.level = Log.Level.DEBUG;
        log.resetCounters();
    });

    it("erases to any on typescript intersection types", function(this: This) {
        const [[variable], program] = mockVariables(`let s: string & number`);
        let symbols = new SymbolTable(program, true);
        let type = symbols.getType(variable, (flags) => fail('Called default type') as any);
        expect(log.errorCount).toBe(0);
        expect(type.constructor.name).toBe('AnyType');
    });  
    
    it("erases to any on unsupported typescript union types", function(this: This) {
        const [[variable], program] = mockVariables(`let s: string | number`);
        let symbols = new SymbolTable(program, true);
        let type = symbols.getType(variable, (flags) => fail('Called default type') as any);
        expect(log.errorCount).toBe(0);
        expect(type.constructor.name).toBe('AnyType');
    });

    it("correctly identifies typescript optional types", function(this: This) {
        const [[a, b, c, d], program] = mockVariables(`
            let a: any | null, 
                b: null | any, 
                c: any | undefined, 
                d: undefined | any;
        `);
        let symbols = new SymbolTable(program, true);
        expect(log.errorCount).toBe(0);
        let aType = symbols.getType(a, (flags) => fail('Called default type') as any);
        expect(aType.constructor.name).toBe('AnyType');
        expect(aType.flags).toBe(AST.Flags.Optional);
        let bType = symbols.getType(b, (flags) => fail('Called default type') as any);
        expect(bType.constructor.name).toBe('AnyType');
        expect(bType.flags).toBe(AST.Flags.Optional);
        let cType = symbols.getType(c, (flags) => fail('Called default type') as any);
        expect(cType.constructor.name).toBe('AnyType');
        expect(cType.flags).toBe(AST.Flags.Optional);
        let dType = symbols.getType(d, (flags) => fail('Called default type') as any);
        expect(dType.constructor.name).toBe('AnyType');
        expect(dType.flags).toBe(AST.Flags.Optional);
    });
    
    it("correctly identifies typescript function types", function(this: This) {
        let [[run, supplier, consumer], program] = mockVariables(`
            let run: () => void,
                supplier: () => ReturnValue,
                consumer: (n :Arg) => void;
            interface ReturnValue {}
            interface Arg {}
        `);
        let symbols = new SymbolTable(program, true);
        expect(log.errorCount).toBe(0);
        let runType = symbols.getType<AST.FunctionType>(run, (flags) => fail('Called default type') as any);
        expect(runType.constructor.name).toBe('FunctionType');
        expect(runType.signature.returnType.constructor.name).toBe('VoidType');
        expect(runType.signature.parameters.length).toBe(0);
        let supplierType = symbols.getType<AST.FunctionType>(supplier, (flags) => fail('Called default type') as any);
        expect(supplierType.constructor.name).toBe('FunctionType');
        expect(supplierType.signature.returnType.constructor.name).toBe('DeclaredType');
        expect((supplierType.signature.returnType as AST.DeclaredType).name).toBe('ReturnValue');
        expect(supplierType.signature.parameters.length).toBe(0);
        let consumerType = symbols.getType<AST.FunctionType>(consumer, (flags) => fail('Called default type') as any);
        expect(consumerType.constructor.name).toBe('FunctionType');
        expect(consumerType.signature.returnType.constructor.name).toBe('VoidType');
        expect(consumerType.signature.parameters.length).toBe(1);
        expect(consumerType.signature.parameters[0].type.constructor.name).toBe('DeclaredType');
        expect((consumerType.signature.parameters[0].type as AST.DeclaredType).name).toBe('Arg');
    });
    
    it("correctly identifies typescript array types", function(this: This) {
        let [[numbers, strings, booleans], program] = mockVariables(`
            let numbers: number[],
                strings: Array<string>,
                booleans: ReadonlyArray<boolean>;
        `);
        let symbols = new SymbolTable(program, true);
        expect(log.errorCount).toBe(0);
        expect(symbols.getType(numbers, (flags) => fail('Called default type') as any).constructor.name).toBe('ArrayType');
        expect(symbols.getType(strings, (flags) => fail('Called default type') as any).constructor.name).toBe('ArrayType');
        expect(symbols.getType(booleans, (flags) => fail('Called default type') as any).constructor.name).toBe('ArrayType');
    });    
    
    it("correctly identifies typescript basic types", function(this: This) {
        const [[s, b, n, a, e, o, d], program] = mockVariables(`
            let s: string,
                b: boolean,
                n: number,
                a: any,
                e: Error,
                o: Object,
                d: Date;
        `);
        let symbols = new SymbolTable(program, true);
        expect(log.errorCount).toBe(0);
        //s: string
        expect(s.name.getText()).toBe('s');
        expect(symbols.getType(s, (flags) => fail('Called default type') as any).constructor.name).toBe('StringType');
        //b: boolean
        expect(b.name.getText()).toBe('b');
        expect(symbols.getType(b, (flags) => fail('Called default type') as any).constructor.name).toBe('BooleanType');
        // n: number
        expect(n.name.getText()).toBe('n');
        expect(symbols.getType(n, (flags) => fail('Called default type') as any).constructor.name).toBe('NumberType');
        //a: any
        expect(a.name.getText()).toBe('a');
        expect(symbols.getType(a, (flags) => fail('Called default type') as any).constructor.name).toBe('AnyType');
        //e: Error
        expect(e.name.getText()).toBe('e');
        expect(symbols.getType(e, (flags) => fail('Called default type') as any).constructor.name).toBe('ErrorType');
        //o: Object
        expect(o.name.getText()).toBe('o');
        expect(symbols.getType(o, (flags) => fail('Called default type') as any).constructor.name).toBe('AnyType');
        //d: Date
        expect(d.name.getText()).toBe('d');
        expect(symbols.getType(d, (flags) => fail('Called default type') as any).constructor.name).toBe('DateType');
    });

    it("correctly identifies typescript declared types", function(this: This) {
        let [[c], program] = mockVariables(`
            let c: Custom;
            interface Custom {}
        `);
        let symbols = new SymbolTable(program, true);
        expect(log.errorCount).toBe(0);
        const type = symbols.getType<AST.DeclaredType>(c, (flags) => fail('Called default type') as any);
        expect(type.constructor.name).toBe('DeclaredType');
        expect(type.name).toBe('Custom');
    });

    it("errors when an typescript undeclared type is referenced", function(this: This) {
        let [[c], program] = mockVariables(`
            let c: Custom;
        `);
        let symbols = new SymbolTable(program, true);
        expect(log.errorCount).toBe(1);
    });

});
