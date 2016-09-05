// import * as fs from 'fs';
// import * as rewire from 'rewire';
// import * as ts from "typescript";
// import * as AST from "../../src/ast"
// import {log, Log} from "../../src/log"
// import {mockProgram} from "./mocks"

// describe("Module", () => {
    
//     interface This {
//         readFileSync: (name: string, encoding: string) => string;
//         readFileMethod: jasmine.Spy;
//         createProgramMethod: jasmine.Spy;            
//         accessMethod: jasmine.Spy;            
//     }
    
//     beforeEach(function(this: This) {
//         log.level = Log.Level.DEBUG;
//         log.resetCounters();
//         this.readFileSync = fs.readFileSync;
//         this.readFileMethod = spyOn(fs, 'readFileSync');
//         this.accessMethod = spyOn(fs, 'accessSync').and.callThrough();
//         this.createProgramMethod = spyOn(ts, 'createProgram').and.callThrough()
//     });
    

//     it("retains a source file if it contains exported declarations", function(this: This) {
//         this.readFileMethod.and.callFake((file: string, encoding: string) => {
//             if(file.startsWith('src')) throw {code: 'ENOENT'};
//             return this.readFileSync(file, encoding);    
//         });
//         const program = mockProgram([['src.ts', 'export let declaration']]);
//         this.createProgramMethod.and.callFake(() => program);
//         let module = new AST.Module("src.ts", undefined, undefined, undefined, false, "utf8");
//         expect(log.errorCount).toBe(0);
//         expect(module.files.length).toBe(1);
//         expect(module.files[0].path.base).toBe("src.ts");
//     });
    
//     it("does not retain a source file if it does not contains exported declarations", function(this: This) {
//         this.readFileMethod.and.callFake((file: string, encoding: string) => {
//             if(file.startsWith('src')) throw {code: 'ENOENT'};
//             return this.readFileSync(file, encoding);    
//         });
//         const program = mockProgram([['src.ts', 'let declaration']]);
//         this.createProgramMethod.and.callFake(() => program);
//         let module = new AST.Module("src.ts", undefined, undefined, undefined, false, "utf8");
//         expect(log.errorCount).toBe(0);
//         expect(module.files.length).toBe(0);
//     });
// });