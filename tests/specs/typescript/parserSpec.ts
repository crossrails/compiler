import * as fs from 'fs';
import * as rewire from 'rewire';
import * as ts from "typescript";
import * as AST from "../../../src/ast"
import {TypeScriptParser} from "../../../src/typescript/parser"
import {log, Log} from "../../../src/log"
import {mockProgram} from "./mocks"

describe("TypeScriptParser", () => {
    
    interface This {
        ast: typeof AST & rewire.Rewire;
        createProgramMethod: jasmine.Spy;             
        variableDeclarationConstructor: jasmine.Spy;            
    }
    
    beforeEach(function(this: This) {
        this.ast = rewire<typeof AST>('../../../src/ast');
        this.variableDeclarationConstructor = jasmine.createSpy('VariableDeclaration');
        this.ast.__set__('VariableDeclaration', this.variableDeclarationConstructor);
        this.createProgramMethod = spyOn(ts, 'createProgram').and.callThrough(); 
        log.level = Log.Level.DEBUG;
        log.resetCounters();
    });
    

    it("errors when module source file do not exist", function(this: This) {
        const readFileSync = fs.readFileSync;
        const readFileMethod = spyOn(fs, 'readFileSync').and.callFake((file: string, encoding: string) => {
            if(file.startsWith('missingfile')) throw {code: 'ENOENT'};
            return readFileSync(file, encoding);    
        });
        const parser = new TypeScriptParser({sourceRoot: '.', sources: ["missingfile.js"]}, false, 'uft8');
        parser.parse();
        expect(readFileMethod).toHaveBeenCalled();
        expect(log.errorCount).toBe(1);
    });

    it("retains a source file if it contains exported declarations", function(this: This) {
        const program = mockProgram([['src.ts', 'export let declaration']]);
        this.createProgramMethod.and.callFake(() => program);
        const parser = new TypeScriptParser({sourceRoot: '.', sources: ["src.ts"]}, false, 'uft8');
        const module = parser.parse();
        expect(log.errorCount).toBe(0);
        expect(module.files.length).toBe(1);
        expect(module.files[0].path.base).toBe("src.ts");
    });
    
    it("does not retain a source file if it does not contains exported declarations", function(this: This) {
        const program = mockProgram([['src.ts', 'let declaration']]);
        this.createProgramMethod.and.callFake(() => program);
        const parser = new TypeScriptParser({sourceRoot: '.', sources: ["src.ts"]}, false, 'uft8');
        const module = parser.parse();
        expect(log.errorCount).toBe(0);
        expect(module.files.length).toBe(0);
    });

    it("considers global declarations static", function(this: This) {
        const program = mockProgram([['src.ts', 'export let declaration']]);
        this.createProgramMethod.and.callFake(() => program);
        const parser = new TypeScriptParser({sourceRoot: '.', sources: ["src.ts"]}, false, 'uft8');
        const module = parser.parse();
        expect(log.errorCount).toBe(0);
        expect(module.files[0].declarations[0].isStatic).toBe(true);
    });

    it("merges members from two declarations of the same interface", function(this: This) {
        const program = mockProgram([['src.ts', `
            interface Foo {
                firstMember: any;
            }
            interface Foo {
                firstMember: any;
                secondMember: any;
            }
        `]]);
        this.createProgramMethod.and.callFake(() => program);
        const parser = new TypeScriptParser({sourceRoot: '.', sources: ["src.ts"]}, true, 'uft8');
        const module = parser.parse();
        expect(log.errorCount).toBe(0);
        expect(module.files[0].declarations.length).toBe(1);
        expect((module.files[0].declarations[0] as AST.InterfaceDeclaration).declarations.length).toBe(2);
    });

    it("merges members from an interface into a class if one exists with the same name", function(this: This) {
        const program = mockProgram([['src.ts', `
            class Foo {
                firstMember: any;
            }
            interface Foo {
                firstMember: any;
                secondMember: any;
            }
        `]]);
        this.createProgramMethod.and.callFake(() => program);
        const parser = new TypeScriptParser({sourceRoot: '.', sources: ["src.ts"]}, true, 'uft8');
        const module = parser.parse();
        expect(log.errorCount).toBe(0);
        expect(module.files[0].declarations.length).toBe(1);
        expect((module.files[0].declarations[0] as AST.ClassDeclaration).declarations.length).toBe(2);
        expect((module.files[0].declarations[0] as AST.ClassDeclaration).declarations[1].isAbstract).toBe(true);
    });

    it("merges members from a namespace into a class if one exists with the same name", function(this: This) {
        const program = mockProgram([['src.ts', `
            class Foo {
                firstMember: any
                thirdMember: any;
            }
            namespace Foo {
                export var firstMember: any
                export function secondMember() {}
            }
        `]]);
        this.createProgramMethod.and.callFake(() => program);
        const parser = new TypeScriptParser({sourceRoot: '.', sources: ["src.ts"]}, true, 'uft8');
        const module = parser.parse();
        expect(log.errorCount).toBe(0);
        expect(module.files[0].declarations.length).toBe(1);
        let members = (module.files[0].declarations[0] as AST.ClassDeclaration).declarations;
        expect(members.length).toBe(4);
        expect(members[0].name).toBe('firstMember');
        expect(members[0].isStatic).toBe(false);
        expect(members[1].name).toBe('thirdMember');
        expect(members[1].isStatic).toBe(false);
        expect(members[2].name).toBe('firstMember');
        expect(members[2].isStatic).toBe(true);
        expect(members[3].name).toBe('secondMember');
        expect(members[3].isStatic).toBe(true);
    });

    it("merges members from two declarations of the same namespace", function(this: This) {
        const program = mockProgram([['src.ts', `
            namespace Foo {
                export var firstMember: any;
                export function secondMember(): any {};
                export var thirdMember: any;
            }

            namespace Foo {
                export var firstMember: any;
                export var fourMember: any;
            }
        `]]);
        this.createProgramMethod.and.callFake(() => program);
        const parser = new TypeScriptParser({sourceRoot: '.', sources: ["src.ts"]}, true, 'uft8');
        const module = parser.parse();
        expect(log.errorCount).toBe(0);
        expect(module.files[0].declarations.length).toBe(1);
        expect((module.files[0].declarations[0] as AST.NamespaceDeclaration).declarations.length).toBe(4);
    });
    
    it("assumes void for return types and any for argument types when none specified", function(this: This) {
        const program = mockProgram([['src.ts', "export function myfunc(a) {}"]]);
        this.createProgramMethod.and.callFake(() => program);
        const parser = new TypeScriptParser({sourceRoot: '.', sources: ["src.ts"]}, true, 'uft8');
        const module = parser.parse();
        let myfunc = module.files[0].declarations[0] as AST.FunctionDeclaration;
        expect(log.errorCount).toBe(0);
        expect(myfunc.signature.returnType.constructor.name).toBe('VoidType');
        expect(myfunc.signature.parameters[0].type.constructor.name).toBe('AnyType');
    });

    it("has an any type when missing type information", function(this: This) {
        let program = mockProgram([['source.ts', "export let declaration"]]);
        this.createProgramMethod.and.callFake(() => program);
        const parser = new TypeScriptParser({sourceRoot: '.', sources: ["source.ts"]}, true, 'uft8');
        const module = parser.parse();
        let declaration = module.files[0].declarations[0] as AST.VariableDeclaration;
        expect(log.errorCount).toBe(0);
        expect(declaration.type.constructor.name).toBe('AnyType');
    });

    it("retains type information when specified in the source", function(this: This) {
        let program = mockProgram([['source.ts', "export let declaration: string"]]);
        this.createProgramMethod.and.callFake(() => program);
        const parser = new TypeScriptParser({sourceRoot: '.', sources: ["source.ts"]}, true, 'uft8');
        const module = parser.parse();
        let declaration = module.files[0].declarations[0] as AST.VariableDeclaration;
        expect(log.errorCount).toBe(0);
        expect(declaration.type.constructor.name).toBe('StringType');
    });

});
