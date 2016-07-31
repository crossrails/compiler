import * as fs from 'fs';
import * as rewire from 'rewire';
import * as ts from "typescript";
import * as AST from "../../src/ast"
import {log} from "../../src/log"

function withSource(implicitExport: boolean, source: string): AST.SourceFile {
    const services = ts.createLanguageService({
        getScriptFileNames: () => ['source.ts'],
        getScriptVersion: (fileName) => '0',
        getScriptSnapshot: (fileName) => ts.ScriptSnapshot.fromString(source),
        getCurrentDirectory: () => process.cwd(),
        getCompilationSettings: () => { return {allowJS: true, noLib: true} },
        getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    }, ts.createDocumentRegistry())
    let context = {typeChecker: services.getProgram().getTypeChecker(), identifiers: new Set(), queue: [], thrownTypes: new Set(), typeDeclarations: new Map()}
    const file = new AST.SourceFile(services.getProgram().getSourceFile('source.ts'), implicitExport, {} as any, context as any);
    context.queue.forEach(f => f())
    return file;
}

describe("MemberDeclaration", () => {

    it("considers global declarations static", function() {
        let sourceFile = withSource(false, "export let declaration");
        expect((sourceFile.declarations[0] as AST.VariableDeclaration).static).toBe(true);
    });

});

describe("TypeDeclaration", () => {

    it("skips private member declarations", function() {
        let sourceFile = withSource(true, `
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
        `);
        console.log(sourceFile);
        expect((sourceFile.declarations[0] as AST.TypeDeclaration).members.length).toBe(1);
    });

});

describe("InterfaceDeclaration", () => {

    it("merges members from two declarations of the same interface", function() {
        log.setLevel('debug')
        let sourceFile = withSource(true, `
            interface MyInterface {
                firstMember;
            }
            interface MyInterface {
                secondMember;
            }
        `);
        expect(sourceFile.declarations.length).toBe(1);
        expect((sourceFile.declarations[0] as AST.InterfaceDeclaration).members.length).toBe(2);
    });

});

describe("FunctionDeclaration", () => {

    it("assumes void for return types and any for argument types when none specified", function() {
        let sourceFile = withSource(false, "export function myfunc(a) {}");
        let myfunc = sourceFile.declarations[0] as AST.FunctionDeclaration;
        expect(myfunc.signature.returnType.constructor.name).toBe('VoidType');
        expect(myfunc.signature.parameters[0].type.constructor.name).toBe('AnyType');
    });

    it("correctly parses throw tags from the jsdoc comment ", function() {
        let sourceFile = withSource(false, `
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
        `);
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
        typeFromMethod: jasmine.Spy;            
        anyTypeConstructor: jasmine.Spy;            
    }
    
    beforeEach(function(this: This) {
        this.ast = rewire<typeof AST>('../../src/ast');
        this.typeFromMethod = jasmine.createSpy('Type.from');
        this.ast.__set__('Type.from', this.typeFromMethod);
        this.anyTypeConstructor = jasmine.createSpy('AnyType');
        this.ast.__set__('AnyType', this.anyTypeConstructor);
    });
    
    it("has an any type when missing type information", function(this: This) {
        let sourceFile = withSource(false, "export let declaration");
        expect(this.anyTypeConstructor).toHaveBeenCalledTimes(1);
    });

    it("retains type information when specified in the source", function(this: This) {
        let sourceFile = withSource(false, "export let declaration: string");
        expect(this.typeFromMethod).toHaveBeenCalledTimes(1);
    });

});
