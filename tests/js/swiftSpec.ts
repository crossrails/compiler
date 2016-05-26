// import * as path from 'path';
// import {Module, Declaration} from "../../src/ast"
// import {SwiftEmitter} from "../../src/swift/swift"

// class MockEmitter extends SwiftEmitter {
//     protected header(resourcePath?: string): string {
//         return '';
        
//     }
    
//     protected footer(identifiers?: Set<string>): string {
//         return '';
        
//     }
    
//     protected declaration(declaration: Declaration): string {
//         return '';
//     }
// }

// describe("SwiftEmitter", () => {
    
//     beforeEach(() => {
//     });
    
//     it("writes a module file when one not present in the module source files", () => {
//         this.module = {files: [{path: {dir: ".", name:"sourcefile"}}], name: "module"}
//         this.emitter = new MockEmitter()
//         spyOn(this.emitter, 'writeFile');
//         this.emitter.emit({outDir: "."});
//         expect(this.emitter.writeFile).toHaveBeenCalledTimes(2);
//         expect(this.emitter.writeFile.calls.argsFor(0)[0]).toBe('sourcefile.swift');
//         expect(this.emitter.writeFile.calls.argsFor(1)[0]).toBe('module.swift');
//     });
        
//     it("source file is merged with module file if names match", () => {
//         this.module = {files: [], name: "module", identifiers: [], src: {dir: ".", name:"src.js"}};
//         this.module.files[0] = {path: {dir: ".", name: "module"}, declarations: [], module: this.module};
//         this.emitter = new MockEmitter()
//         spyOn(this.emitter, 'writeFile');
//         this.emitter.emit({outDir: "."});
//         expect(this.emitter.writeFile).toHaveBeenCalledTimes(1);
//         expect(this.emitter.writeFile.calls.argsFor(0)[0]).toBe('module.swift');
//     });
        
// });