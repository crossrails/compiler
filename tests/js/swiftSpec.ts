import {Module} from "../../src/ast"
import {SwiftEmitter} from "../../src/swift/swift"
import {Environment as Nunjucks, FileSystemLoader} from 'nunjucks'
import {Options} from 'yargs';
import * as path from 'path';

describe("SwiftEmitter", () => {
    
    beforeEach(() => {
    });
    
    it("writes a module file when one not present in the module source files", () => {
        this.module = {files: [{path: {dir: ".", name:"sourcefile"}}], name: "module"}
        this.emitter = new SwiftEmitter(this.module)
        spyOn(this.emitter, 'writeFile');
        this.emitter.emit({outDir: "."});
        expect(this.emitter.writeFile).toHaveBeenCalledTimes(2);
        expect(this.emitter.writeFile.calls.argsFor(0)[0]).toBe('sourcefile.swift');
        expect(this.emitter.writeFile.calls.argsFor(1)[0]).toBe('module.swift');
    });
        
    it("source file is merged with module file if names match", () => {
        this.module = {files: [], name: "module", identifiers: [], src: {dir: ".", name:"src.js"}};
        this.module.files[0] = {path: {dir: ".", name: "module"}, declarations: [], module: this.module};
        this.emitter = new SwiftEmitter(this.module)
        spyOn(this.emitter, 'writeFile');
        this.emitter.emit({outDir: "."});
        expect(this.emitter.writeFile).toHaveBeenCalledTimes(1);
        expect(this.emitter.writeFile.calls.argsFor(0)[0]).toBe('module.swift');
    });
        
});