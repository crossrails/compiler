import {Module} from "../../src/ast"
import {Compiler, CompilerOptions} from "../../src/compiler"
import {log} from "../../src/log"

describe("Compiler", () => {
    
    interface This {
        module: Module;
    }

    beforeEach(function(this: This) {
        this.module = {} as Module;
        log.resetCounters();
    });
    
    it("errors when no output languages specified", function(this: This) {
        let compiler = new Compiler({outDir: '.'}, [['language', ['engine']]]);
        let emitMethodOnTheCompiler = spyOn(compiler, 'emit');
        expect(compiler.compile(this.module)).toBeGreaterThan(0);
        expect(emitMethodOnTheCompiler).not.toHaveBeenCalled();
    });
        
    it("defaults to first engine if none specified in options", function(this: This) {
        let options = {outDir: '.', 'language': {}};
        let compiler = new Compiler(options, [['language', ['engine1', 'engine2']]]);
        let emitMethodOnTheCompiler = spyOn(compiler, 'emit');
        expect(compiler.compile(this.module)).toBe(0);
        expect(emitMethodOnTheCompiler).toHaveBeenCalledTimes(1);
        expect(emitMethodOnTheCompiler).toHaveBeenCalledWith(this.module, 'language', 'engine1', jasmine.anything());
    });
    
    it("emits to only to the engine specified in the options", function(this: This) {
        let options = {outDir: '.', 'language': {'engine2': {}}};
        let compiler = new Compiler(options, [['language', ['engine1', 'engine2']]]);
        let emitMethodOnTheCompiler = spyOn(compiler, 'emit');
        expect(compiler.compile(this.module)).toBe(0);
        expect(emitMethodOnTheCompiler).toHaveBeenCalledTimes(1);
        expect(emitMethodOnTheCompiler).toHaveBeenCalledWith(this.module, 'language', 'engine2', jasmine.anything());
    });    
    
    it("passes compiler level options to the emitter", function(this: This) {
        let options = {outDir: '.', 'language': {}, 'complierOption': true};
        let compiler = new Compiler(options, [['language', ['engine']]]);
        let emitMethodOnTheCompiler = spyOn(compiler, 'emit');
        expect(compiler.compile(this.module)).toBe(0);
        expect(emitMethodOnTheCompiler).toHaveBeenCalledWith(this.module, 'language', 'engine', jasmine.objectContaining({'complierOption': true}));
    }); 
    
    it("passes language level options to the emitter", function(this: This) {
        let options = {outDir: '.', 'language': {'languageOption': true}};
        let compiler = new Compiler(options, [['language', ['engine']]]);
        let emitMethodOnTheCompiler = spyOn(compiler, 'emit');
        expect(compiler.compile(this.module)).toBe(0);
        expect(emitMethodOnTheCompiler).toHaveBeenCalledWith(this.module, 'language', 'engine', jasmine.objectContaining({'languageOption': true}));
    });
         
    it("passes engine level options to the emitter", function(this: This) {
        let options = {outDir: '.', 'language': {'engine': {'engineOption': true}}};
        let compiler = new Compiler(options, [['language', ['engine']]]);
        let emitMethodOnTheCompiler = spyOn(compiler, 'emit');
        expect(compiler.compile(this.module)).toBe(0);
        expect(emitMethodOnTheCompiler).toHaveBeenCalledWith(this.module, 'language', 'engine', jasmine.objectContaining({'engineOption': true}));
    });
        
    it("overwrites compiler level options with language level options", function(this: This) {
        let options = {outDir: '.', 'language': {'option': true}, 'option': false};
        let compiler = new Compiler(options, [['language', ['engine']]]);
        let emitMethodOnTheCompiler = spyOn(compiler, 'emit');
        expect(compiler.compile(this.module)).toBe(0);
        expect(emitMethodOnTheCompiler).toHaveBeenCalledWith(this.module, 'language', 'engine', jasmine.objectContaining({'option': true}));
    });   
    
    it("overwrites language level options with engine level options", function(this: This) {
        let options = {outDir: '.', 'language': {'engine': {'option': true}, 'option': false}, 'option': false};
        let compiler = new Compiler(options, [['language', ['engine']]]);
        let emitMethodOnTheCompiler = spyOn(compiler, 'emit');
        expect(compiler.compile(this.module)).toBe(0);
        expect(emitMethodOnTheCompiler).toHaveBeenCalledWith(this.module, 'language', 'engine', jasmine.objectContaining({'option': true}));
    });   
});