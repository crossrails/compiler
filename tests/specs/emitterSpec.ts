import * as fs from 'fs';
import {sep} from 'path';
import {Module} from "../../src/ast"
import {Emitter} from "../../src/emitter"
import {log} from "../../src/log"

var mkdirp = require('mkdirp');

describe("Emitter", () => {
    
    interface This {
    }

    beforeEach(function(this: This) {
        log.resetCounters();
    });
    
    it("errors when no output languages specified", function(this: This) {
        let emitter = new Emitter({} as any, [['language', ['engine']]]);
        let emitEngineMethodOnTheEmitter = spyOn(emitter, 'emitEngine');
        expect(emitter.emit('main.js', {} as Module)).toBeGreaterThan(0);
        expect(emitEngineMethodOnTheEmitter).not.toHaveBeenCalled();
    });
        
    it("defaults to first engine if none specified in options", function(this: This) {
        let options = {emit: true, 'language': {}};
        let emitter = new Emitter(options as any, [['language', ['engine1', 'engine2']]]);
        let emitEngineMethodOnTheEmitter = spyOn(emitter, 'emitEngine');
        expect(emitter.emit('main.js', {} as Module)).toBe(0);
        expect(emitEngineMethodOnTheEmitter).toHaveBeenCalledTimes(1);
        expect(emitEngineMethodOnTheEmitter).toHaveBeenCalledWith(jasmine.anything(), 'language', 'engine1', '.', jasmine.anything());
    });
    
    it("emits to only to the engine specified in the options", function(this: This) {
        let options = {emit: true, 'language': {'engine2': {}}};
        let emitter = new Emitter(options as any, [['language', ['engine1', 'engine2']]]);
        let emitEngineMethodOnTheEmitter = spyOn(emitter, 'emitEngine');
        expect(emitter.emit('main.js', {} as Module)).toBe(0);
        expect(emitEngineMethodOnTheEmitter).toHaveBeenCalledTimes(1);
        expect(emitEngineMethodOnTheEmitter).toHaveBeenCalledWith(jasmine.anything(), 'language', 'engine2', '.', jasmine.anything());
    });    
    
    it("passes emitter level options to the emitter", function(this: This) {
        let options = {emit: true, 'language': {}, 'complierOption': true};
        let emitter = new Emitter(options as any, [['language', ['engine']]]);
        let emitEngineMethodOnTheEmitter = spyOn(emitter, 'emitEngine');
        expect(emitter.emit('main.js', {} as Module)).toBe(0);
        expect(emitEngineMethodOnTheEmitter).toHaveBeenCalledWith(jasmine.anything(), 'language', 'engine', '.', jasmine.objectContaining({'complierOption': true}));
    }); 
    
    it("passes language level options to the emitter", function(this: This) {
        let options = {emit: true, 'language': {'languageOption': true}};
        let emitter = new Emitter(options as any, [['language', ['engine']]]);
        let emitEngineMethodOnTheEmitter = spyOn(emitter, 'emitEngine');
        expect(emitter.emit('main.js', {} as Module)).toBe(0);
        expect(emitEngineMethodOnTheEmitter).toHaveBeenCalledWith(jasmine.anything(), 'language', 'engine', '.', jasmine.objectContaining({'languageOption': true}));
    });
         
    it("passes engine level options to the emitter", function(this: This) {
        let options = {emit: true, 'language': {'engine': {'engineOption': true}}};
        let emitter = new Emitter(options as any, [['language', ['engine']]]);
        let emitEngineMethodOnTheEmitter = spyOn(emitter, 'emitEngine');
        expect(emitter.emit('main.js', {} as Module)).toBe(0);
        expect(emitEngineMethodOnTheEmitter).toHaveBeenCalledWith(jasmine.anything(), 'language', 'engine', '.', jasmine.objectContaining({'engineOption': true}));
    });
        
    it("overwrites emitter level options with language level options", function(this: This) {
        let options = {emit: true, 'language': {'option': true}, 'option': false};
        let emitter = new Emitter(options as any, [['language', ['engine']]]);
        let emitEngineMethodOnTheEmitter = spyOn(emitter, 'emitEngine');
        expect(emitter.emit('main.js', {} as Module)).toBe(0);
        expect(emitEngineMethodOnTheEmitter).toHaveBeenCalledWith(jasmine.anything(), 'language', 'engine', '.', jasmine.objectContaining({'option': true}));
    });   
    
    it("overwrites language level options with engine level options", function(this: This) {
        let options = {emit: true, 'language': {'engine': {'option': true}, 'option': false}, 'option': false};
        let emitter = new Emitter(options as any, [['language', ['engine']]]);
        let emitEngineMethodOnTheEmitter = spyOn(emitter, 'emitEngine');
        expect(emitter.emit('main.js', {} as Module)).toBe(0);
        expect(emitEngineMethodOnTheEmitter).toHaveBeenCalledWith(jasmine.anything(), 'language', 'engine', '.', jasmine.objectContaining({'option': true}));
    });   

    it("emits when emit is true", function(this: This) {
        let emitter = new Emitter({emit: true, emitWrapper: true, '.': {}} as any, [['.', ['emitter']]]);
        let emitMethodOnTheModule = jasmine.createSpy('emit').and.callFake((outDir: string, options: any, writeFile: (filename: string, data: string) => void) => {
            writeFile('name', 'content');
        })
        let emitWrapperMethodOnTheModule = jasmine.createSpy('emitWrapper')
        spyOn(mkdirp, 'sync');
        spyOn(fs, 'writeFileSync');
        expect(emitter.emit('main.js', {emit: emitMethodOnTheModule, emitWrapper: emitWrapperMethodOnTheModule} as any)).toBe(0);
        expect(emitWrapperMethodOnTheModule).toHaveBeenCalled()
        expect(mkdirp.sync).toHaveBeenCalled()
        expect(fs.writeFileSync).toHaveBeenCalled()
    });

    it("does not emit when emit is false", function(this: This) {
        let emitter = new Emitter({emit: false, emitWrapper: true, '.': {}} as any, [['.', ['emitter']]]);
        let emitMethodsOnTheModule = jasmine.createSpy('emit').and.callFake((outDir: string, options: any, writeFile: (filename: string, data: string) => void) => {
            writeFile('name', 'content');
        })
        spyOn(mkdirp, 'sync');
        spyOn(fs, 'writeFileSync');
        expect(emitter.emit('main.js', {emit: emitMethodsOnTheModule, emitWrapper: emitMethodsOnTheModule} as any)).toBe(0);
        expect(mkdirp.sync).not.toHaveBeenCalled();
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it("does not emit a language when emit is false for that language", function(this: This) {
        let emitter = new Emitter({'.': {emit: false}, './': {emit: true}} as any, [['.', ['emitter']], ['./', ['emitter']]]);
        let emitMethodOnTheModule = jasmine.createSpy('emit').and.callFake((outDir: string, options: any, writeFile: (filename: string, data: string) => void) => {
            writeFile('name', 'content');
        })
        spyOn(fs, 'writeFileSync');
        expect(emitter.emit('main.js', {emit: emitMethodOnTheModule} as any)).toBe(0);
        expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    it("sets outDir to the path specified in the emit* options", function(this: This) {
        let emitter = new Emitter({emit: `emit/path`, emitWrapper: `wrapper/path`, emitJS: `js/path`, '.': {}} as any, [['.', ['emitter']]]);
        let emitMethodOnTheModule = jasmine.createSpy('emit')
        let emitWrapperMethodOnTheModule = jasmine.createSpy('emitWrapper')
        spyOn(fs, 'writeFileSync');
        spyOn(fs, 'readFileSync');
        expect(emitter.emit('src.js', {emit: emitMethodOnTheModule, emitWrapper: emitWrapperMethodOnTheModule} as any)).toBe(0);
        expect(emitMethodOnTheModule).toHaveBeenCalledWith(`emit/path`, jasmine.anything(), jasmine.anything());
        expect(emitWrapperMethodOnTheModule).toHaveBeenCalledWith(`wrapper/path`, jasmine.anything(), jasmine.anything());
        expect(fs.readFileSync).toHaveBeenCalledWith('src.js', 'utf8');
        expect(fs.writeFileSync).toHaveBeenCalledWith(`js${sep}path${sep}src.js`, undefined);
    });

    it("creates a new directory and any necessary subdirectories on writeFile", function(this: This) {
        let emitter = new Emitter({emit: true, '.': {}} as any, [['.', ['emitter']]]);
        let emitMethodOnTheModule = jasmine.createSpy('emit').and.callFake((outDir: string, options: any, writeFile: (filename: string, data: string) => void) => {
            writeFile('path/to/file', 'content');
        })
        spyOn(mkdirp, 'sync');
        spyOn(fs, 'writeFileSync');
        expect(emitter.emit('main.js', {emit: emitMethodOnTheModule} as any)).toBe(0);
        expect(mkdirp.sync).toHaveBeenCalledWith('path/to')
    });
});