import * as fs from 'fs';
import * as path from 'path';
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

        it("fails when no args given and no package manifest file in working directory", function(this: This) {
            let main = require('../../src/main');
            let readFileSync = fs.readFileSync;
            spyOn(fs, 'readFileSync').and.callFake((file: string, encoding: string) => {
                if(!file.includes('node_modules')) throw {code: 'ENOENT'};
                return readFileSync(file, encoding);
            });
            expect(main(
                "--swift"
            )).toBe(1);
            expect(this.moduleConstructor).not.toHaveBeenCalled();
        });

        it("reads package.json when no args given and package.json file in working directory", function(this: This) {
            let main = require('../../src/main');
            let readFileSync = fs.readFileSync;
            spyOn(fs, 'readFileSync').and.callFake((file: string, encoding: string) => {
                if(file == 'package.json') return JSON.stringify({main: 'package.js', typings: 'package.d.ts'});
                if(file == 'package.js') return "";
                return readFileSync(file, encoding);
            });
            expect(main(
                "--swift"
            )).toBe(0);
            expect(this.moduleConstructor).toHaveBeenCalledWith('package.js', undefined, undefined, "package.d.ts", jasmine.anything(), jasmine.anything());
        });

        it("reads bower.json when no args given and bower.json file in working directory", function(this: This) {
            let main = require('../../src/main');
            let readFileSync = fs.readFileSync;
            spyOn(fs, 'readFileSync').and.callFake((file: string, encoding: string) => {
                if(file == 'bower.json') return JSON.stringify({main: 'bower.js'});
                if(file == 'bower.js') return "";
                return readFileSync(file, encoding);
            });
            expect(main(
                "--swift"
            )).toBe(0);
            expect(this.moduleConstructor).toHaveBeenCalledWith('bower.js', undefined, undefined, undefined, jasmine.anything(), jasmine.anything());
        });

        it("reads package.json when given as arg", function(this: This) {
            let main = require('../../src/main');
            let readFileSync = fs.readFileSync;
            spyOn(fs, 'readFileSync').and.callFake((file: string, encoding: string) => {
                if(file == 'bower.json') return JSON.stringify({main: 'bower.js'});
                if(file == 'package.json') return JSON.stringify({main: 'package.js', typings: 'package.d.ts'});
                if(file == 'package.js') return "";
                if(file == 'bower.js') return "";
                return readFileSync(file, encoding);
            });
            expect(main(
                "package.json",
                "--swift"
            )).toBe(0);
            expect(this.moduleConstructor).toHaveBeenCalledWith('package.js', undefined, undefined, "package.d.ts", jasmine.anything(), jasmine.anything());
        });

        it("reads bower.json when given as arg", function(this: This) {
            let main = require('../../src/main');
            let readFileSync = fs.readFileSync;
            spyOn(fs, 'readFileSync').and.callFake((file: string, encoding: string) => {
                if(file == 'bower.json') return JSON.stringify({main: 'bower.js'});
                if(file == 'package.json') return JSON.stringify({main: 'package.js', typings: 'package.d.ts'});
                if(file == 'package.js') return "";
                if(file == 'bower.js') return "";
                return readFileSync(file, encoding);
            });
            expect(main(
                "bower.json",
                "--swift"
            )).toBe(0);
            expect(this.moduleConstructor).toHaveBeenCalledWith('bower.js', undefined, undefined, undefined, jasmine.anything(), jasmine.anything());
        });

        it("fails when non js or manifest file arg given", function(this: This) {
            try {
                require('../../src/main')(
                    `types.ts`, 
                    '--swift'
                );
                fail("did not throw");
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
            expect(this.moduleConstructor).toHaveBeenCalledWith(`src.js`, 'source.js.map', undefined, undefined, jasmine.anything(), jasmine.anything());
        });

        it("passes in the declaration file specified in the options", function(this: This) {
            require('../../src/main')(
                `src.js`,
                `--declarationFile=source.d.ts`,
                '--swift'
            );
            expect(this.moduleConstructor).toHaveBeenCalledWith(`src.js`, undefined, 'source.d.ts', undefined, jasmine.anything(), jasmine.anything());
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

        it("does not pass in options containing a language attribute if none specified", function(this: This) {
            require('../../src/main')(
                `src.js`
            );
            expect(this.compilerConstructor).not.toHaveBeenCalledWith(jasmine.objectContaining({swift: jasmine.anything()}), jasmine.anything());
            expect(this.compilerConstructor).not.toHaveBeenCalledWith(jasmine.objectContaining({java: jasmine.anything()}), jasmine.anything());
            expect(this.compilerConstructor).not.toHaveBeenCalledWith(jasmine.objectContaining({cs: jasmine.anything()}), jasmine.anything());
            expect(this.compilerConstructor).not.toHaveBeenCalledWith(jasmine.objectContaining({php: jasmine.anything()}), jasmine.anything());
        });
    });
});
