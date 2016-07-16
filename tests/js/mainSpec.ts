import * as fs from 'fs';
import * as ast from '../../src/ast';
import * as compiler from '../../src/compiler';

describe("Main", () => {
    
    // it("successfully compiles the input project", function() {
    //     let exitCode = require('../../src/main')(
    //         './tests/input/src.js',
    //         '--emit=false',
    //         '--implicitExport', 
    //         '--swift',
    //         '--java.basePackage=io.xrails'
    //     );
    //     expect(exitCode).toBe(0);
    // });

    describe("Isolated", () => {
        
        interface This {
            moduleConstructor: jasmine.Spy;  
            compilerConstructor: jasmine.Spy          
        }
        
        beforeEach(function(this: This) {
            this.moduleConstructor = spyOn(ast, 'Module').and.callFake(() => { return {emit: () => {}} });
            this.compilerConstructor = spyOn(compiler, 'Compiler').and.callFake(() => { return {compile: () => {}} });;
        });

        it("fails when no args given", function(this: This) {
            try {
                require('../../src/main')();
                fail("did not fail");
            } catch(e) {
                expect(e).toMatch('need at least 1');
                expect(this.moduleConstructor).not.toHaveBeenCalled();
            }
        });

        it("fails when non js file arg given", function(this: This) {
            try {
                require('../../src/main')(
                    `types.ts`, 
                    '--swift'
                );
                fail("did not fail");
            } catch(e) {
                expect(e).toMatch('must be a javascript source file')
                expect(this.moduleConstructor).not.toHaveBeenCalled()
            }
        });

        it("passes in the sourcemap specified in the options", function(this: This) {
            require('../../src/main')(
                `src.js`,
                `--sourceMap=source.js.map`,
                '--swift'
            );
            expect(this.moduleConstructor).toHaveBeenCalledWith(`src.js`, 'source.js.map', jasmine.anything(), jasmine.anything());
        });

        it("passes emit* options as booleans if they equal 'true' or 'false'", function(this: This) {
            require('../../src/main')(
                `src.js`,
                '--emit=path',
                '--emitJS=true',
                '--emitWrapper=false',
                '--swift'
            );
            expect(this.compilerConstructor).toHaveBeenCalledWith(jasmine.objectContaining({emit: "path", emitJS: true, emitWrapper: false}), jasmine.anything());
        });
    });
});
