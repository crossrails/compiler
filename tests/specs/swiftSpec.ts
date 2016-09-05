// import * as path from 'path';
// import {Module, Declaration} from "../../src/ast"
// import {SwiftEmitter,SwiftEmitterOptions} from "../../src/swift/swift"

// class MockEmitter extends SwiftEmitter {
//     protected header(resourcePath?: string): string {
//         return '';        
//     }
    
//     protected footer(identifiers?: ReadonlyArray<string>): string {
//         return '';        
//     }
    
//     protected declaration(declaration: Declaration): string {
//         return '';
//     }
// }

// describe("SwiftEmitter", () => {
    
//     interface This {
//         module: Module;
//         emitter: MockEmitter;
//         writeFileMethodOnTheEmitter: jasmine.Spy;
//         headerMethodOnTheEmitter: jasmine.Spy;
//         footerMethodOnTheEmitter: jasmine.Spy;
//     }

//     beforeEach(function(this: This) {
//         this.module = {} as Module;
//         this.emitter = new MockEmitter()
//         this.writeFileMethodOnTheEmitter = spyOn(this.emitter, 'writeFile');
//         this.headerMethodOnTheEmitter = spyOn(this.emitter, 'header');
//         this.footerMethodOnTheEmitter = spyOn(this.emitter, 'footer');
//     });
    
//     it("writes a module file when one not present in the module source files", function(this: This) {
//         let module: any = {files: [{path: {dir: ".", name: "sourcefile"}, declarations: []}], name: "module", sourceRoot: '.', identifiers: new Set()};
//         this.emitter.emit(module, {outDir: "."} as any);
//         expect(this.headerMethodOnTheEmitter).toHaveBeenCalledTimes(2);
//         expect(this.footerMethodOnTheEmitter).toHaveBeenCalledTimes(2);
//         expect(this.writeFileMethodOnTheEmitter).toHaveBeenCalledTimes(2);
//         //source file
//         expect(this.headerMethodOnTheEmitter.calls.argsFor(0)[0]).toBeUndefined();
//         expect(this.footerMethodOnTheEmitter.calls.argsFor(0)[0]).toBeUndefined();
//         expect(this.writeFileMethodOnTheEmitter.calls.argsFor(0)[0]).toBe('sourcefile.swift');
//         //module file
//         expect(this.headerMethodOnTheEmitter.calls.argsFor(1)[0]).not.toBeUndefined();
//         expect(this.footerMethodOnTheEmitter.calls.argsFor(1)[0]).not.toBeUndefined();
//         expect(this.writeFileMethodOnTheEmitter.calls.argsFor(1)[0]).toBe('module.swift');
//     });
        
//     it("merges a source file with the module file if names match", function(this: This) {
//         let module: any = {files: [], name: "module", identifiers: new Set(), sourceRoot: '.', src: {dir: ".", name: "src.js"}};
//         module.files[0] = {path: {dir: ".", name: "module"}, declarations:[], module: module};
//         this.emitter.emit(module, {outDir: "."} as any);
//         expect(this.writeFileMethodOnTheEmitter).toHaveBeenCalledTimes(1);
//         expect(this.writeFileMethodOnTheEmitter.calls.argsFor(0)[0]).toBe('module.swift');
//         expect(this.headerMethodOnTheEmitter.calls.argsFor(0)[0]).not.toBeUndefined();
//         expect(this.footerMethodOnTheEmitter.calls.argsFor(0)[0]).not.toBeUndefined();
//     });
        
// });