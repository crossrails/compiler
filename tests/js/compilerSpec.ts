import * as fs from 'fs';
import {sep} from 'path';
import {Module} from "../../src/ast"
import {Compiler, CompilerOptions} from "../../src/compiler"
import {log} from "../../src/log"

var mkdirp = require('mkdirp');

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
        let compiler = new Compiler({emit: true, emitWrapper: true, '.': {}} as any, [['.', ['compiler']]]);
        let emitMethodOnTheModule = jasmine.createSpy('emit').and.callFake((outDir: string, options: any, writeFile: (filename: string, data: string) => void) => {
            writeFile('name', 'content');
        })
        let emitWrapperMethodOnTheModule = jasmine.createSpy('emitWrapper')
        spyOn(mkdirp, 'sync');
        spyOn(fs, 'writeFileSync');
        expect(compiler.compile({emit: emitMethodOnTheModule, emitWrapper: emitWrapperMethodOnTheModule} as any)).toBe(0);
        expect(emitWrapperMethodOnTheModule).toHaveBeenCalled()
        expect(mkdirp.sync).toHaveBeenCalled()
        expect(fs.writeFileSync).toHaveBeenCalled()
    });

    it("does not emit when emit is false", function(this: This) {
        let compiler = new Compiler({emit: false, emitWrapper: true, '.': {}} as any, [['.', ['compiler']]]);
        let emitMethodsOnTheModule = jasmine.createSpy('emit').and.callFake((outDir: string, options: any, writeFile: (filename: string, data: string) => void) => {
            writeFile('name', 'content');
        })
        let emitWrapperMethodOnTheModule = jasmine.createSpy('emitWrapper')
        spyOn(mkdirp, 'sync');
        spyOn(fs, 'writeFileSync');
        expect(compiler.compile({emit: emitMethodsOnTheModule, emitWrapper: emitMethodsOnTheModule} as any)).toBe(0);
        expect(mkdirp.sync).not.toHaveBeenCalled();
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it("does not emit a language when emit is false for that language", function(this: This) {
        let compiler = new Compiler({'.': {emit: false}, './': {emit: true}} as any, [['.', ['compiler']], ['./', ['compiler']]]);
        let emitMethodOnTheModule = jasmine.createSpy('emit').and.callFake((outDir: string, options: any, writeFile: (filename: string, data: string) => void) => {
            writeFile('name', 'content');
        })
        spyOn(fs, 'writeFileSync');
        expect(compiler.compile({emit: emitMethodOnTheModule} as any)).toBe(0);
        expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    it("sets outDir to the path specified in the emit* options", function(this: This) {
        let compiler = new Compiler({emit: `emit/path`, emitWrapper: `wrapper/path`, emitJS: `js/path`, '.': {}} as any, [['.', ['compiler']]]);
        let emitMethodOnTheModule = jasmine.createSpy('emit')
        let emitWrapperMethodOnTheModule = jasmine.createSpy('emitWrapper')
        spyOn(fs, 'writeFileSync');
        spyOn(fs, 'readFileSync');
        expect(compiler.compile({src: {dir:".", base:"src.js"}, emit: emitMethodOnTheModule, emitWrapper: emitWrapperMethodOnTheModule} as any)).toBe(0);
        expect(emitMethodOnTheModule).toHaveBeenCalledWith(`emit/path`, jasmine.anything(), jasmine.anything());
        expect(emitWrapperMethodOnTheModule).toHaveBeenCalledWith(`wrapper/path`, jasmine.anything(), jasmine.anything());
        expect(fs.readFileSync).toHaveBeenCalledWith('src.js', 'utf8');
        expect(fs.writeFileSync).toHaveBeenCalledWith(`js${sep}path${sep}src.js`, undefined);
    });

    it("creates a new directory and any necessary subdirectories on writeFile", function(this: This) {
        let compiler = new Compiler({emit: true, '.': {}} as any, [['.', ['compiler']]]);
        let emitMethodOnTheModule = jasmine.createSpy('emit').and.callFake((outDir: string, options: any, writeFile: (filename: string, data: string) => void) => {
            writeFile('path/to/file', 'content');
        })
        spyOn(mkdirp, 'sync');
        spyOn(fs, 'writeFileSync');
        expect(compiler.compile({emit: emitMethodOnTheModule} as any)).toBe(0);
        expect(mkdirp.sync).toHaveBeenCalledWith('path/to')
    });
});