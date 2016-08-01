import * as fs from 'fs';
import * as rewire from 'rewire';
import * as ts from "typescript";
import * as AST from "../../src/ast"
import {log} from "../../src/log"
import {mockProgram} from "./mocks"

describe("Module", () => {
    
    interface This {
        readFileSync: (name: string, encoding: string) => string;
        readFileMethod: jasmine.Spy;
        createProgramMethod: jasmine.Spy;            
        accessMethod: jasmine.Spy;            
    }
    
    beforeEach(function(this: This) {
        log.resetCounters();
        this.readFileSync = fs.readFileSync;
        this.readFileMethod = spyOn(fs, 'readFileSync');
        this.accessMethod = spyOn(fs, 'accessSync').and.callThrough();
        this.createProgramMethod = spyOn(ts, 'createProgram').and.callThrough()
    });
    
    it("errors when module source file do not exist", function(this: This) {
        this.readFileMethod.and.callFake((file: string, encoding: string) => {
            if(file.startsWith('missing')) throw {code: 'ENOENT'};
            return this.readFileSync(file, encoding);    
        });
        let module = new AST.Module("missingfile.js", undefined, undefined, undefined, false, "utf8");
        expect(this.readFileMethod).toHaveBeenCalledTimes(2);
        expect(log.errorCount).toBe(1);
    });

    it("throws file not found when sourcemap specified but does not exist", function(this: This) {
        this.readFileMethod.and.callFake((file: string, encoding: string) => {
            if(file == 'missingfile.js.map') throw {code: 'ENOENT'};
            return this.readFileSync(file, encoding);    
        });
        try {
            let module = new AST.Module("missingfile.js", "missingfile.js.map", undefined, undefined, false, "utf8");
            fail("Did not throw exception");
        } catch(error) {
            expect(error.code).toBe('ENOENT');
        }
    });

    it("throws file not found when declaration specified but does not exist", function(this: This) {
        this.readFileMethod.and.callFake((file: string, encoding: string) => {
            if(file == 'missingfile.d.ts') throw {code: 'ENOENT'};
            return this.readFileSync(file, encoding);    
        });
        try {
            let module = new AST.Module("missingfile.js", undefined, "missingfile.d.ts", undefined, false, "utf8");
            fail("Did not throw exception");
        } catch(error) {
            expect(error.code).toBe('ENOENT');
        }
    });

    it("reads the sourcemap if one is passed in and throws if not found", function(this: This) {
        this.readFileMethod.and.callFake((file: string, encoding: string) => {
            if(file == 'different.js.map') throw {code: 'ENOENT'};
            return this.readFileSync(file, encoding);    
        });
        try {
            let module = new AST.Module("src.js", "different.js.map", undefined, undefined, false, "utf8");
            fail('Did not throw')
        } catch(error) {
            expect(this.readFileMethod).toHaveBeenCalledWith("different.js.map", jasmine.anything());
        }
    });
    
    it("prefers sourcemap over typings file", function(this: This) {
        this.readFileMethod.and.callFake((file: string, encoding: string) => {
            if(file == 'src.js.map') return JSON.stringify({sources: ['src.js'], sourceRoot: ""});
            return this.readFileSync(file, encoding);    
        });
        let module = new AST.Module("src.js", undefined, undefined, "typings.d.ts", false, "utf8");
        expect(this.createProgramMethod).toHaveBeenCalledWith(['src.js'], jasmine.anything())
    });
    
    it("reads the declaration file over typings file if both passed in", function(this: This) {
        this.readFileMethod.and.callFake((file: string, encoding: string) => {
            return this.readFileSync(file, encoding);    
        });
        this.accessMethod.and.callFake(() => {
            return true;
        })
        let module = new AST.Module("src.js", undefined, "different.d.ts", "typings.d.ts", false, "utf8");
        expect(this.createProgramMethod).toHaveBeenCalledWith(['different.d.ts'], jasmine.anything())
    });
    
    it("attempts to read the sourcemap, then the declaration file beside the input file if none specified", function(this: This) {
        this.readFileMethod.and.callFake((file: string, encoding: string) => {
            if(file == 'src.js.map') throw {code: 'ENOENT'};
            return this.readFileSync(file, encoding);    
        });
        this.accessMethod.and.callFake(() => {
            return true;
        })
        let module = new AST.Module("src.js", undefined, undefined, undefined, false, "utf8");
        expect(this.readFileMethod).toHaveBeenCalledWith("src.js.map", jasmine.anything());
        expect(this.createProgramMethod).toHaveBeenCalledWith(['src.d.ts'], jasmine.anything())
    });
    
    it("parses the supplied file if source map and declaration file not found", function(this: This) {
        this.readFileMethod.and.callFake((file: string, encoding: string) => {
            if(file.startsWith('src')) throw {code: 'ENOENT'};
            return this.readFileSync(file, encoding);    
        });
        let module = new AST.Module("src.js", undefined, undefined, undefined, false, "utf8");
        expect(this.createProgramMethod).toHaveBeenCalledWith(['src.js'], jasmine.anything())
    });

    it("parses the files specified in the source map if found", function(this: This) {
        this.readFileMethod.and.callFake((file: string, encoding: string) => {
            if(file == 'transpiled.js.map') return '{"sourceRoot": "", "sources": ["source1.ts", "source2.ts"]}';    
            return this.readFileSync(file, encoding);    
        });
        let module = new AST.Module("transpiled.js", undefined, undefined, undefined, false, "utf8");
        expect(this.createProgramMethod).toHaveBeenCalledWith(['source1.ts', 'source2.ts'], jasmine.anything())
    });

    it("retains a source file if it contains exported declarations", function(this: This) {
        this.readFileMethod.and.callFake((file: string, encoding: string) => {
            if(file.startsWith('src')) throw {code: 'ENOENT'};
            return this.readFileSync(file, encoding);    
        });
        const program = mockProgram([['src.ts', 'export let declaration']]);
        this.createProgramMethod.and.callFake(() => program);
        let module = new AST.Module("src.ts", undefined, undefined, undefined, false, "utf8");
        expect(log.errorCount).toBe(0);
        expect(module.files.length).toBe(1);
        expect(module.files[0].path.base).toBe("src.ts");
    });
    
    it("does not retain a source file if it does not contains exported declarations", function(this: This) {
        this.readFileMethod.and.callFake((file: string, encoding: string) => {
            if(file.startsWith('src')) throw {code: 'ENOENT'};
            return this.readFileSync(file, encoding);    
        });
        const program = mockProgram([['src.ts', 'let declaration']]);
        this.createProgramMethod.and.callFake(() => program);
        let module = new AST.Module("src.ts", undefined, undefined, undefined, false, "utf8");
        expect(log.errorCount).toBe(0);
        expect(module.files.length).toBe(0);
    });
});