import {Module} from "../../src/ast"
import {SwiftEmitter} from "../../src/swift/swift"
import {Environment as Nunjucks, FileSystemLoader} from 'nunjucks'
import {Options} from 'yargs';
import * as path from 'path';

describe("SwiftEmitter", () => {
    
    beforeEach(() => {
        this.module = {files: [{path: {dir: "", name:"sourcefile"}}], name: "module"}
        this.emitter = new SwiftEmitter(this.module)
        spyOn(this.emitter, 'writeFile');
    });
    
    it("writes a module file when one not present in the module source files", () => {
        this.emitter.emit({outDir: ""});
        expect(this.emitter.writeFile).toHaveBeenCalledTimes(2);
        expect(this.emitter.writeFile.calls.argsFor(0)[0]).toBe('sourcefile.swift');
        expect(this.emitter.writeFile.calls.argsFor(1)[0]).toBe('module.swift');
    });
        
});