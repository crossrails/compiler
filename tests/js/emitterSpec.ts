// import * as fs from 'fs';
// import {Module} from "../../src/ast"
// import {Emitter, EmitterOptions} from "../../src/emitter"

// class MockEmitter extends Emitter<EmitterOptions> {
//     protected emitModule(module: Module, options: EmitterOptions): void {
//         this.writeFile("file", "body");        
//     }
// }

// describe("Emitter", () => {
    
//     interface This {
//         emitter: MockEmitter;            
//     }
    
//     beforeEach(function(this: This) {
//         this.emitter = new MockEmitter();
//         spyOn(fs, 'writeFileSync');
//     });
    
//     it("writeFile emits when noEmit is not present", function(this: This) {
//         this.emitter.emit({} as Module, {outDir: '.'});
//         expect(fs.writeFileSync).toHaveBeenCalledTimes(1)
//     });

//     it("writeFile does not emit when noEmit is present", function(this: This) {
//         this.emitter.emit({} as Module, {noEmit: true, outDir: '.'});
//         expect(fs.writeFileSync).not.toHaveBeenCalled();
//     });
// });