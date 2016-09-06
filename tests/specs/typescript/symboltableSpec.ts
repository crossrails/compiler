import * as fs from 'fs';
import * as rewire from 'rewire';
import * as ts from "typescript";
import * as AST from "../../../src/ast"
import {log, Log} from "../../../src/log"
import {SymbolTable} from "../../../src/typescript/symboltable"
import {mockVariables, mockProgram} from "./mocks"

describe("SymbolTable", () => {
    
    beforeEach(function() {
        log.level = Log.Level.DEBUG;
        log.resetCounters();
    });

    it("does not export global non exported declarations when implicitExport is false", function() {
        const [[variable], program] = mockVariables(`let declaration`);
        const symbols = new SymbolTable(program, false);
        expect(log.errorCount).toBe(0);
        expect(symbols.isExported(variable)).toBe(false);
    });

    it("exports global non exported declarations when implicitExport is true", function() {
        const [[variable], program] = mockVariables(`let declaration`);
        const symbols = new SymbolTable(program, true);
        expect(log.errorCount).toBe(0);
        expect(symbols.isExported(variable)).toBe(true);
    });

    it("exports global declarations with export keyword even when implicitExport is false", function() {
        const [[variable], program] = mockVariables(`export let declaration`);
        const symbols = new SymbolTable(program, false);
        expect(log.errorCount).toBe(0);
        expect(symbols.isExported(variable)).toBe(true);
    });

    it("exports global declarations with export jsdoc tag even when implicitExport is false", function() {
        const [[variable], program] = mockVariables(`/** @export */ let declaration`);
        const symbols = new SymbolTable(program, false);
        expect(log.errorCount).toBe(0);
        expect(symbols.isExported(variable)).toBe(true);
    });

    it("does not export non exported declarations inside a namespace even when implicitExport is true", function() {
        const program = mockProgram([['src.ts', `
            namespace Foo {
                var bar;
            }
        `]]);
        const symbols = new SymbolTable(program, true);
        expect(log.errorCount).toBe(0);
        let foo = program.getSourceFile('src.ts').statements[0] as ts.ModuleDeclaration;
        expect(symbols.isExported(foo)).toBe(true);
        let bar = ((foo.body as ts.ModuleBlock).statements[0] as ts.VariableStatement).declarationList.declarations[0];
        expect(symbols.isExported(bar)).toBe(false);
    });

    it("exports declarations with export keyword inside a namespace", function() {
        const program = mockProgram([['src.ts', `
            export namespace Foo {
                export var bar;
            }
        `]]);
        const symbols = new SymbolTable(program, false);
        expect(log.errorCount).toBe(0);
        let foo = program.getSourceFile('src.ts').statements[0] as ts.ModuleDeclaration;
        expect(symbols.isExported(foo)).toBe(true);
        let bar = ((foo.body as ts.ModuleBlock).statements[0] as ts.VariableStatement).declarationList.declarations[0];
        expect(symbols.isExported(bar)).toBe(true);
    });

    it("does not export declarations with export keyword inside an unexported namespace", function() {
        const program = mockProgram([['src.ts', `
            namespace Foo {
                export var bar;
            }
        `]]);
        const symbols = new SymbolTable(program, false);
        expect(log.errorCount).toBe(0);
        let foo = program.getSourceFile('src.ts').statements[0] as ts.ModuleDeclaration;
        expect(symbols.isExported(foo)).toBe(false);
        let bar = ((foo.body as ts.ModuleBlock).statements[0] as ts.VariableStatement).declarationList.declarations[0];
        expect(symbols.isExported(bar)).toBe(false);
    });

    it("does not export declarations inside an unexported class", function() {
        const program = mockProgram([['src.ts', `
            class Foo {
                bar;
            }
        `]]);
        const symbols = new SymbolTable(program, false);
        expect(log.errorCount).toBe(0);
        let foo = program.getSourceFile('src.ts').statements[0] as ts.ClassDeclaration;
        expect(symbols.isExported(foo)).toBe(false);
        let bar = foo.members[0] as ts.PropertyDeclaration;
        expect(symbols.isExported(bar)).toBe(false);
    });

    // it("exports non exported types when referenced in an exported declaration", function() {
    //     const program = mockProgram([['src.ts', `
    //         class UnexportedType {}
    //         export var declaration: UnexportedType;
    //     `]]);
    //     const symbols = new SymbolTable(program, false);
    //     expect(log.errorCount).toBe(0);
    //     const unexportedType = program.getSourceFile('src.ts').statements[0] as ts.ClassDeclaration;
    //     expect(unexportedType.name!.text).toBe('UnexportedType');
    //     expect(symbols.isExported(unexportedType)).toBe(true);
    // });

    // it("exports non exported types when referenced in a throws jsdoc tag on an exported declaration", function() {
    //     const program = mockProgram([['src.ts', `
    //         class UnexportedType {}
    //         /** @throws {UnexportedType} */
    //         export function throwUnexportedType(): void {}
    //     `]]);
    //     const symbols = new SymbolTable(program, false);
    //     expect(log.errorCount).toBe(0);
    //     const unexportedType = program.getSourceFile('src.ts').statements[0] as ts.ClassDeclaration;
    //     expect(unexportedType.name!.text).toBe('UnexportedType');
    //     expect(symbols.isExported(unexportedType)).toBe(true);
    // });

    it("not does not export private member declarations", function() {
        const program = mockProgram([['src.ts', `
            export class MyClass {
                publicVar;
                protected protectedVar;
                private privateKeywordUsed;
                /**
                 * @private
                 */            
                privateTagUsed;
                /**
                 * @access private
                 */            
                accessTagUsed;
            }
        `]]);
        const symbols = new SymbolTable(program, false);
        expect(log.errorCount).toBe(0);
        let myClass = program.getSourceFile('src.ts').statements[0] as ts.ClassDeclaration;
        expect(symbols.isExported(myClass)).toBe(true);
        let publicVar = myClass.members[0] as ts.PropertyDeclaration;
        expect(symbols.getName(publicVar)).toBe('publicVar');
        expect(symbols.isExported(publicVar)).toBe(true);
        let protectedVar = myClass.members[1] as ts.PropertyDeclaration;
        expect(symbols.getName(protectedVar)).toBe('protectedVar');
        expect(symbols.isExported(protectedVar)).toBe(true);
        let privateKeywordUsed = myClass.members[2] as ts.PropertyDeclaration;
        expect(symbols.getName(privateKeywordUsed)).toBe('privateKeywordUsed');
        expect(symbols.isExported(privateKeywordUsed)).toBe(false);
        let privateTagUsed = myClass.members[3] as ts.PropertyDeclaration;
        expect(symbols.getName(privateTagUsed)).toBe('privateTagUsed');
        expect(symbols.isExported(privateTagUsed)).toBe(false);
        let accessTagUsed = myClass.members[4] as ts.PropertyDeclaration;
        expect(symbols.getName(accessTagUsed)).toBe('accessTagUsed');
        expect(symbols.isExported(accessTagUsed)).toBe(false);
    });

    it("correctly parses throw tags from the jsdoc comment ", function() {
        const program = mockProgram([['src.ts', `
            export class BigError {}
            export class SmallError {}
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
        `]]);
        const symbols = new SymbolTable(program, false);
        expect(log.errorCount).toBe(0);
        expect(symbols.isThrown(program.getSourceFile('src.ts').statements[0] as ts.ClassDeclaration)).toBe(true);
        expect(symbols.isThrown(program.getSourceFile('src.ts').statements[1] as ts.ClassDeclaration)).toBe(true);
        const justThrows = symbols.getSignature(program.getSourceFile('src.ts').statements[2] as ts.FunctionDeclaration);
        expect(justThrows.thrownTypes.length).toBe(1);
        expect(justThrows.thrownTypes[0].constructor.name).toBe('AnyType');
        let throwsError = symbols.getSignature(program.getSourceFile('src.ts').statements[3] as ts.FunctionDeclaration);
        expect(throwsError.thrownTypes.length).toBe(1);
        expect(throwsError.thrownTypes[0].constructor.name).toBe('ErrorType');
        let throwsSeveral = symbols.getSignature(program.getSourceFile('src.ts').statements[4] as ts.FunctionDeclaration);
        expect(throwsSeveral.thrownTypes.length).toBe(2);
        expect(throwsSeveral.thrownTypes[0].constructor.name).toBe('DeclaredType');
        expect(throwsSeveral.thrownTypes[1].constructor.name).toBe('DeclaredType');
    });
    
    it("erases to any on typescript intersection types", function() {
        const [[variable], program] = mockVariables(`let s: string & number`);
        let symbols = new SymbolTable(program, true);
        let type = symbols.getType(variable, (flags) => fail('Called default type') as any);
        expect(log.errorCount).toBe(0);
        expect(type.constructor.name).toBe('AnyType');
    });  
    
    it("erases to any on unsupported typescript union types", function() {
        const [[variable], program] = mockVariables(`let s: string | number`);
        let symbols = new SymbolTable(program, true);
        let type = symbols.getType(variable, (flags) => fail('Called default type') as any);
        expect(log.errorCount).toBe(0);
        expect(type.constructor.name).toBe('AnyType');
    });

    it("correctly identifies typescript optional types", function() {
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
    
    it("correctly identifies typescript function types", function() {
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
    
    it("correctly identifies typescript array types", function() {
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
    
    it("correctly identifies typescript basic types", function() {
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

    it("correctly identifies typescript declared types", function() {
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

    it("errors when an typescript undeclared type is referenced", function() {
        let [[c], program] = mockVariables(`
            let c: Custom;
        `);
        let symbols = new SymbolTable(program, true);
        expect(log.errorCount).toBe(1);
    });

});
