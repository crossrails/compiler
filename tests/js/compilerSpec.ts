import * as fs from 'fs';
import {Module} from "../../src/ast"
import {Compiler, CompilerOptions} from "../../src/compiler"
import {log} from "../../src/log"

describe("Compiler", () => {
    
    interface This {
    }

    beforeEach(function(this: This) {
        log.resetCounters();
    });
    
    it("errors when no output languages specified", function(this: This) {
        let compiler = new Compiler({} as any, [['language', ['engine']]]);
        let emitMethodOnTheCompiler = spyOn(compiler, 'emit');
        expect(compiler.compile({} as Module)).toBeGreaterThan(0);
        expect(emitMethodOnTheCompiler).not.toHaveBeenCalled();
    });
        
    it("defaults to first engine if none specified in options", function(this: This) {
        let options = {emit: true, 'language': {}};
        let compiler = new Compiler(options as any, [['language', ['engine1', 'engine2']]]);
        let emitMethodOnTheCompiler = spyOn(compiler, 'emit');
        expect(compiler.compile({} as Module)).toBe(0);
        expect(emitMethodOnTheCompiler).toHaveBeenCalledTimes(1);
        expect(emitMethodOnTheCompiler).toHaveBeenCalledWith({} as Module, 'language', 'engine1', '.', jasmine.anything());
    });
    
    it("emits to only to the engine specified in the options", function(this: This) {
        let options = {emit: true, 'language': {'engine2': {}}};
        let compiler = new Compiler(options as any, [['language', ['engine1', 'engine2']]]);
        let emitMethodOnTheCompiler = spyOn(compiler, 'emit');
        expect(compiler.compile({} as Module)).toBe(0);
        expect(emitMethodOnTheCompiler).toHaveBeenCalledTimes(1);
        expect(emitMethodOnTheCompiler).toHaveBeenCalledWith({} as Module, 'language', 'engine2', '.', jasmine.anything());
    });    
    
    it("passes compiler level options to the emitter", function(this: This) {
        let options = {emit: true, 'language': {}, 'complierOption': true};
        let compiler = new Compiler(options as any, [['language', ['engine']]]);
        let emitMethodOnTheCompiler = spyOn(compiler, 'emit');
        expect(compiler.compile({} as Module)).toBe(0);
        expect(emitMethodOnTheCompiler).toHaveBeenCalledWith({} as Module, 'language', 'engine', '.', jasmine.objectContaining({'complierOption': true}));
    }); 
    
    it("passes language level options to the emitter", function(this: This) {
        let options = {emit: true, 'language': {'languageOption': true}};
        let compiler = new Compiler(options as any, [['language', ['engine']]]);
        let emitMethodOnTheCompiler = spyOn(compiler, 'emit');
        expect(compiler.compile({} as Module)).toBe(0);
        expect(emitMethodOnTheCompiler).toHaveBeenCalledWith({} as Module, 'language', 'engine', '.', jasmine.objectContaining({'languageOption': true}));
    });
         
    it("passes engine level options to the emitter", function(this: This) {
        let options = {emit: true, 'language': {'engine': {'engineOption': true}}};
        let compiler = new Compiler(options as any, [['language', ['engine']]]);
        let emitMethodOnTheCompiler = spyOn(compiler, 'emit');
        expect(compiler.compile({} as Module)).toBe(0);
        expect(emitMethodOnTheCompiler).toHaveBeenCalledWith({} as Module, 'language', 'engine', '.', jasmine.objectContaining({'engineOption': true}));
    });
        
    it("overwrites compiler level options with language level options", function(this: This) {
        let options = {emit: true, 'language': {'option': true}, 'option': false};
        let compiler = new Compiler(options as any, [['language', ['engine']]]);
        let emitMethodOnTheCompiler = spyOn(compiler, 'emit');
        expect(compiler.compile({} as Module)).toBe(0);
        expect(emitMethodOnTheCompiler).toHaveBeenCalledWith({} as Module, 'language', 'engine', '.', jasmine.objectContaining({'option': true}));
    });   
    
    it("overwrites language level options with engine level options", function(this: This) {
        let options = {emit: true, 'language': {'engine': {'option': true}, 'option': false}, 'option': false};
        let compiler = new Compiler(options as any, [['language', ['engine']]]);
        let emitMethodOnTheCompiler = spyOn(compiler, 'emit');
        expect(compiler.compile({} as Module)).toBe(0);
        expect(emitMethodOnTheCompiler).toHaveBeenCalledWith({} as Module, 'language', 'engine', '.', jasmine.objectContaining({'option': true}));
    });   

    it("emits when emit is true", function(this: This) {
        let compiler = new Compiler({emit: true, '.': {}} as any, [['.', ['compiler']]]);
        let emitMethodOnTheModule = jasmine.createSpy('emit').and.callFake((outDir: string, options: any, writeFile: (filename: string, data: string) => void) => {
            writeFile('name', 'content');
        })
        spyOn(fs, 'writeFileSync');
        expect(compiler.compile({emit: emitMethodOnTheModule} as any)).toBe(0);
        expect(fs.writeFileSync).toHaveBeenCalled()
    });

    it("does not emit when emit is false", function(this: This) {
        let compiler = new Compiler({emit: false, '.': {}} as any, [['.', ['compiler']]]);
        let emitMethodOnTheModule = jasmine.createSpy('emit').and.callFake((outDir: string, options: any, writeFile: (filename: string, data: string) => void) => {
            writeFile('name', 'content');
        })
        spyOn(fs, 'writeFileSync');
        expect(compiler.compile({emit: emitMethodOnTheModule} as any)).toBe(0);
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it("does not emit a language when emit is false for that language ", function(this: This) {
        let compiler = new Compiler({'.': {emit: false}, './': {emit: true}} as any, [['.', ['compiler']], ['./', ['compiler']]]);
        let emitMethodOnTheModule = jasmine.createSpy('emit').and.callFake((outDir: string, options: any, writeFile: (filename: string, data: string) => void) => {
            writeFile('name', 'content');
        })
        spyOn(fs, 'writeFileSync');
        expect(compiler.compile({emit: emitMethodOnTheModule} as any)).toBe(0);
        expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    });
});