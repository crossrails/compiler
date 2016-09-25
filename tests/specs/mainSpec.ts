import * as fs from 'fs';
import * as parser from '../../src/typescript/parser';
import * as emitter from '../../src/emitter';
import {log} from "../../src/log"

describe("Main", () => {
    
    beforeEach(function() {
        log.resetCounters();
    });

    it("successfully compiles the input project", function() {
        let exitCode = require('../../src/main')(
            './tests/input/src.js',
            '--logLevel=debug',
            '--emit=false',
            '--implicitExport', 
            '--swift',
            '--java.basePackage=io.xrails'
        );
        expect(exitCode).toBe(0);
    });

    describe("Isolated", () => {
        
        interface This {
            parserConstructor: jasmine.Spy;  
            emitterConstructor: jasmine.Spy          
        }
        
        beforeEach(function(this: This) {
            this.parserConstructor = spyOn(parser, 'TypeScriptParser').and.callFake(() => { return {parse: () => { return {files: []}}}});
            this.emitterConstructor = spyOn(emitter, 'Emitter').and.callFake(() => { return {emit: () => {}} });
        });

        it("fails when no args given and no package manifest file in working directory", function(this: This) {
            let main = require('../../src/main');
            let readFileSync = fs.readFileSync;
            spyOn(fs, 'readFileSync').and.callFake((file: string, encoding: string) => {
                if(!file.includes('node_modules')) throw {code: 'ENOENT'};
                return readFileSync(file, encoding);
            });
            expect(main(
                '--logLevel=debug',
                "--swift"
            )).toBe(1);
            expect(this.parserConstructor).not.toHaveBeenCalled();
        });

        it("reads package.json when no args given if package.json file is in working directory", function(this: This) {
            let main = require('../../src/main');
            let readFileSync = fs.readFileSync;
            spyOn(fs, 'readFileSync').and.callFake((file: string, encoding: string) => {
                if(file == 'package.json') return JSON.stringify({main: 'package.js', typings: 'package.d.ts'});
                if(file == 'package.js') return "";
                return readFileSync(file, encoding);
            });
            expect(main(
                '--logLevel=debug',
                "--swift",
            )).toBe(0);
            expect(this.parserConstructor).toHaveBeenCalledWith({sourceRoot: '.', sources: ['package.js']}, jasmine.anything(), jasmine.anything());
        });

        it("reads bower.json when no args given and bower.json file in working directory", function(this: This) {
            let main = require('../../src/main');
            let readFileSync = fs.readFileSync;
            spyOn(fs, 'readFileSync').and.callFake((file: string, encoding: string) => {
                console.log(file, encoding);
                if(file == 'package.json') throw {code: 'ENOENT'};
                if(file == 'bower.json') return JSON.stringify({main: 'bower.js'});
                if(file == 'bower.js') return "";
                return readFileSync(file, encoding);
            });
            expect(main(
                '--logLevel=debug',
                "--swift",
            )).toBe(0);
            expect(this.parserConstructor).toHaveBeenCalledWith({sourceRoot: '.', sources: ['bower.js']}, jasmine.anything(), jasmine.anything());
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
                '--logLevel=debug',
                "--swift",
            )).toBe(0);
            expect(this.parserConstructor).toHaveBeenCalledWith({sourceRoot: '.', sources: ['package.js']}, jasmine.anything(), jasmine.anything());
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
                '--logLevel=debug',
                "--swift"
            )).toBe(0);
            expect(this.parserConstructor).toHaveBeenCalledWith({sourceRoot: '.', sources: ['bower.js']}, jasmine.anything(), jasmine.anything());
        });

        it("fails when non js or manifest file arg given", function(this: This) {
            try {
                require('../../src/main')(
                    `types.ts`, 
                    '--logLevel=debug',
                    '--swift'
                );
                fail("did not throw");
            } catch(e) {
                expect(e).toMatch('must be a javascript source file')
                expect(this.parserConstructor).not.toHaveBeenCalled()
            }
        });

        it("throws file not found when sourcemap specified but does not exist", function(this: This) {
            let main = require('../../src/main');
            let readFileSync = fs.readFileSync;
            spyOn(fs, 'readFileSync').and.callFake((file: string, encoding: string) => {
                if(file == 'source.js.map') throw {code: 'ENOENT'};
                return readFileSync(file, encoding);
            });
            try {
                main(
                    `src.js`,
                    '--logLevel=debug',
                    `--sourceMap=source.js.map`,
                    '--swift'
                )
                fail("Did not throw exception");
            } catch(error) {
                expect(error.code).toBe('ENOENT');
                expect(this.parserConstructor).not.toHaveBeenCalled();
            }
        });

        it("throws file not found when declaration specified but does not exist", function(this: This) {
            let main = require('../../src/main');
            let readFileSync = fs.readFileSync;
            spyOn(fs, 'readFileSync').and.callFake((file: string, encoding: string) => {
                if(file == 'source.d.ts') throw {code: 'ENOENT'};
                return readFileSync(file, encoding);
            });
            try {
                main(
                    `src.js`,
                    '--logLevel=debug',
                    `--declarationFile=source.d.ts`,
                    '--swift'
                )
                fail("Did not throw exception");
            } catch(error) {
                expect(error.code).toBe('ENOENT');
                expect(this.parserConstructor).not.toHaveBeenCalled();
            }
        });

        it("prefers sourcemap over typings file if neither passed in", function(this: This) {
            let main = require('../../src/main');
            let readFileSync = fs.readFileSync;
            spyOn(fs, 'readFileSync').and.callFake((file: string, encoding: string) => {
                if(file == 'package.json') return JSON.stringify({main: 'main.js', typings: 'typings.d.ts'});
                if(file == 'main.js.map') return JSON.stringify({sources: ['src.js'], sourceRoot: ""});
                if(file == 'typings.d.ts') return "";
                if(file == 'main.d.ts') return "";
                return readFileSync(file, encoding);
            });
            expect(main(
                '--logLevel=debug',
                "--swift",
            )).toBe(0);
            expect(this.parserConstructor).toHaveBeenCalledWith({sourceRoot: '.', sources: ['src.js']}, jasmine.anything(), jasmine.anything());
        });
        
        it("reads the declaration file over typings file in package.json if passed in", function(this: This) {
            let main = require('../../src/main');
            let readFileSync = fs.readFileSync;
            spyOn(fs, 'readFileSync').and.callFake((file: string, encoding: string) => {
                if(file == 'package.json') return JSON.stringify({main: 'package.js', typings: 'typings.d.ts'});
                if(file == 'package.js') return "";
                return readFileSync(file, encoding);
            });
            let accessSync = fs.accessSync;
            spyOn(fs, 'accessSync').and.callFake((file: string) => {
                if(file == 'source.d.ts') return;
                if(file == 'typings.d.ts') return;
                return accessSync(file);
            });
            expect(main(
                '--logLevel=debug',
                '--declarationFile=source.d.ts',
                "--swift",
            )).toBe(0);
            expect(this.parserConstructor).toHaveBeenCalledWith({sourceRoot: '.', sources: ['source.d.ts']}, jasmine.anything(), jasmine.anything());
        });
        
        it("attempts to read the sourcemap, then the declaration file beside the input file if none specified", function(this: This) {
            let main = require('../../src/main');
            let readFileSync = fs.readFileSync;
            let readFileMethod = spyOn(fs, 'readFileSync').and.callFake((file: string, encoding: string) => {
                if(file == 'src.js.map') throw {code: 'ENOENT'};
                return readFileSync(file, encoding);
            });
            let accessSync = fs.readFileSync;
            spyOn(fs, 'accessSync').and.callFake((file: string) => {
                if(file == 'src.d.ts') return;
                return accessSync(file);
            });
            expect(main(
                "src.js",
                '--logLevel=debug',
                "--swift",
            )).toBe(0);
            expect(this.parserConstructor).toHaveBeenCalledWith({sourceRoot: '.', sources: ['src.d.ts']}, jasmine.anything(), jasmine.anything());
            expect(readFileMethod).toHaveBeenCalledWith("src.js.map", jasmine.anything());
        });
        
        it("parses the supplied file if source map and declaration file not found", function(this: This) {
            let main = require('../../src/main');
            let readFileSync = fs.readFileSync;
            spyOn(fs, 'readFileSync').and.callFake((file: string, encoding: string) => {
                if(file == 'src.js') return "";
                if(file == 'src.js.map') throw {code: 'ENOENT'};
                return readFileSync(file, encoding);
            });
            let accessSync = fs.readFileSync;
            spyOn(fs, 'accessSync').and.callFake((file: string) => {
                if(file == 'src.d.ts') throw {code: 'ENOENT'};
                return accessSync(file);
            });
            expect(main(
                "src.js",
                '--logLevel=debug',
                "--swift",
            )).toBe(0);
            expect(this.parserConstructor).toHaveBeenCalledWith({sourceRoot: '.', sources: ['src.js']}, jasmine.anything(), jasmine.anything());
        });

        it("parses the files specified in the source map if found", function(this: This) {
            let main = require('../../src/main');
            let readFileSync = fs.readFileSync;
            spyOn(fs, 'readFileSync').and.callFake((file: string, encoding: string) => {
                if(file == 'transpiled.js.map') return '{"sourceRoot": "", "sources": ["source1.ts", "source2.ts"]}';    
                return readFileSync(file, encoding);
            });
            expect(main(
                "transpiled.js",
                '--logLevel=debug',
                "--swift",
            )).toBe(0);
            expect(this.parserConstructor).toHaveBeenCalledWith({sourceRoot: '.', sources: ['source1.ts', 'source2.ts']}, jasmine.anything(), jasmine.anything());
        });

        it("passes emit* options as booleans if they equal 'true' or 'false'", function(this: This) {
            require('../../src/main')(
                `src.js`,
                '--emit=path',
                '--emitJS=true',
                '--emitWrapper=false',
                '--swift'
            );
            expect(this.emitterConstructor).toHaveBeenCalledWith(jasmine.objectContaining({emit: "path", emitJS: true, emitWrapper: false}), jasmine.anything());
        });

        it("does not pass in options containing a language attribute if none specified", function(this: This) {
            require('../../src/main')(
                `src.js`
            );
            expect(this.emitterConstructor).not.toHaveBeenCalledWith(jasmine.objectContaining({swift: jasmine.anything()}), jasmine.anything());
            expect(this.emitterConstructor).not.toHaveBeenCalledWith(jasmine.objectContaining({java: jasmine.anything()}), jasmine.anything());
            expect(this.emitterConstructor).not.toHaveBeenCalledWith(jasmine.objectContaining({cs: jasmine.anything()}), jasmine.anything());
            expect(this.emitterConstructor).not.toHaveBeenCalledWith(jasmine.objectContaining({php: jasmine.anything()}), jasmine.anything());
        });
    });
});
