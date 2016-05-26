import {Module} from "../../src/ast"
import {Emitter, EmitterOptions} from "../../src/emitter"
import {Compiler} from "../../src/compiler"

describe("Compiler", () => {
    
    interface This {
        module: Module;
        emitMethodOnTheEmitter: jasmine.Spy;
    }

    beforeEach(function(this: This) {
        this.module = {} as Module;
        this.emitMethodOnTheEmitter = jasmine.createSpy('emitMethodOnTheEmitter');
    });
    
    it("errors when no output languages specified", function(this: This) {
        let compiler = new Compiler({}, [['language', ['engine']]]);
        let loadEmitterMethodOnTheCompiler = spyOn(compiler, 'loadEmitter');
        expect(compiler.compile(this.module)).toBeGreaterThan(0);
        expect(loadEmitterMethodOnTheCompiler).not.toHaveBeenCalled();
        expect(this.emitMethodOnTheEmitter).not.toHaveBeenCalled();
    });
        
    it("defaults to first engine if none specified in options", function(this: This) {
        let options = {'language': {}};
        let compiler = new Compiler(options, [['language', ['engine1', 'engine2']]]);
        let loadEmitterMethodOnTheCompiler = spyOn(compiler, 'loadEmitter').and.returnValue({emit: this.emitMethodOnTheEmitter});
        expect(compiler.compile(this.module)).toBe(0);
        expect(loadEmitterMethodOnTheCompiler).toHaveBeenCalledTimes(1);
        expect(loadEmitterMethodOnTheCompiler).toHaveBeenCalledWith('language', 'engine1');
        expect(this.emitMethodOnTheEmitter).toHaveBeenCalledTimes(1);
        expect(this.emitMethodOnTheEmitter).toHaveBeenCalledWith(this.module, jasmine.anything());
    });
    
    it("emits to only to the engine specified in the options", function(this: This) {
        let options = {'language': {'engine2': {}}};
        let compiler = new Compiler(options, [['language', ['engine1', 'engine2']]]);
        let loadEmitterMethodOnTheCompiler = spyOn(compiler, 'loadEmitter').and.returnValue({emit: this.emitMethodOnTheEmitter});
        expect(compiler.compile(this.module)).toBe(0);
        expect(loadEmitterMethodOnTheCompiler).toHaveBeenCalledTimes(1);
        expect(loadEmitterMethodOnTheCompiler).toHaveBeenCalledWith('language', 'engine2');
        expect(this.emitMethodOnTheEmitter).toHaveBeenCalledTimes(1);
        expect(this.emitMethodOnTheEmitter).toHaveBeenCalledWith(this.module, jasmine.anything());
    });    
    
    it("passes compiler level options to the emitter", function(this: This) {
        let options = {'language': {}, 'complierOption': {}};
        let compiler = new Compiler(options, [['language', ['engine']]]);
        spyOn(compiler, 'loadEmitter').and.returnValue({emit: this.emitMethodOnTheEmitter});
        expect(compiler.compile(this.module)).toBe(0);
        expect(this.emitMethodOnTheEmitter).toHaveBeenCalledWith(this.module, jasmine.objectContaining({'complierOption': {}}));
    }); 
    
    it("passes language level options to the emitter", function(this: This) {
        let options = {'language': {'languageOption': {}}};
        let compiler = new Compiler(options, [['language', ['engine']]]);
        spyOn(compiler, 'loadEmitter').and.returnValue({emit: this.emitMethodOnTheEmitter});
        expect(compiler.compile(this.module)).toBe(0);
        expect(this.emitMethodOnTheEmitter).toHaveBeenCalledWith(this.module, jasmine.objectContaining({'languageOption': {}}));
    });
         
    it("passes engine level options to the emitter", function(this: This) {
        let options = {'language': {'engine': {'engineOption': {}}}};
        let compiler = new Compiler(options, [['language', ['engine']]]);
        spyOn(compiler, 'loadEmitter').and.returnValue({emit: this.emitMethodOnTheEmitter});
        expect(compiler.compile(this.module)).toBe(0);
        expect(this.emitMethodOnTheEmitter).toHaveBeenCalledWith(this.module, jasmine.objectContaining({'engineOption': {}}));
    });
        
    it("overwrites compiler level options with language level options", function(this: This) {
        let options = {'language': {'option': {'languageLevel': {}}}, 'option': {'compilerLevel': {}}};
        let compiler = new Compiler(options, [['language', ['engine']]]);
        spyOn(compiler, 'loadEmitter').and.returnValue({emit: this.emitMethodOnTheEmitter});
        expect(compiler.compile(this.module)).toBe(0);
        expect(this.emitMethodOnTheEmitter).toHaveBeenCalledWith(this.module, jasmine.objectContaining({'option': {'languageLevel': {}}}));
    });   
    
    it("overwrites language level options with engine level options", function(this: This) {
        let options = {'language': {'engine': {'option': {'engineLevel': {}}}, 'option': {'languageLevel': {}}}, 'option': {'compilerLevel': {}}};
        let compiler = new Compiler(options, [['language', ['engine']]]);
        spyOn(compiler, 'loadEmitter').and.returnValue({emit: this.emitMethodOnTheEmitter});
        expect(compiler.compile(this.module)).toBe(0);
        expect(this.emitMethodOnTheEmitter).toHaveBeenCalledWith(this.module, jasmine.objectContaining({'option': {'engineLevel': {}}}));
    });   
});