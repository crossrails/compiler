import * as fs from 'fs';
import * as rewire from 'rewire';
import * as ts from "typescript";
import * as AST from "../../src/ast"
import {log} from "../../src/log"

let ast = rewire<typeof AST>('../../src/ast');

describe("Module", () => {
    
    interface This {
        readFileMethod: jasmine.Spy;            
        accessMethod: jasmine.Spy;            
        createSourceFileMethod: jasmine.Spy;            
    }
    
    beforeEach(function(this: This) {
        this.readFileMethod = spyOn(fs, 'readFileSync');
        this.accessMethod = spyOn(fs, 'accessSync').and.callThrough();
        this.createSourceFileMethod = spyOn(ts, 'createSourceFile').and.callThrough();
    });
    
    it("throws file not found when all module source files do not exist", function(this: This) {
        this.readFileMethod.and.callFake((file: string) => {
            if(file.startsWith('missing')) throw {code: 'ENOENT'};
            return "";    
        });
        try {
            let module = new ast.Module("missingfile.js", undefined, undefined, undefined, false, "utf8");
            fail("Did not throw exception");
        } catch(error) {
            expect(error.code).toBe('ENOENT');
        }
    });

    it("throws file not found when sourcemap specified but does not exist", function(this: This) {
        this.readFileMethod.and.callFake((file: string) => {
            if(file == 'missingfile.js.map') throw {code: 'ENOENT'};
            return "";    
        });
        try {
            let module = new ast.Module("missingfile.js", "missingfile.js.map", undefined, undefined, false, "utf8");
            fail("Did not throw exception");
        } catch(error) {
            expect(error.code).toBe('ENOENT');
        }
    });

    it("throws file not found when declaration specified but does not exist", function(this: This) {
        this.readFileMethod.and.callFake((file: string) => {
            if(file == 'missingfile.d.ts') throw {code: 'ENOENT'};
            return "";    
        });
        try {
            let module = new ast.Module("missingfile.js", undefined, "missingfile.d.ts", undefined, false, "utf8");
            fail("Did not throw exception");
        } catch(error) {
            expect(error.code).toBe('ENOENT');
        }
    });

    it("reads the sourcemap if one is passed in and throws if not found", function(this: This) {
        this.readFileMethod.and.callFake((file: string) => {
            if(file == 'different.js.map') throw {code: 'ENOENT'};
            return "";    
        });
        try {
            let module = new ast.Module("src.js", "different.js.map", undefined, undefined, false, "utf8");
            fail('Did not throw')
        } catch(error) {
            expect(this.readFileMethod).toHaveBeenCalledWith("different.js.map", jasmine.anything());
        }
    });
    
    it("prefers sourcemap over typings file", function(this: This) {
        this.readFileMethod.and.callFake((file: string) => {
            if(file == 'src.js.map') return JSON.stringify({sources: [], sourceRoot: ""});
            return "";    
        });
        let module = new ast.Module("src.js", undefined, undefined, "typings.d.ts", false, "utf8");
        expect(this.createSourceFileMethod).not.toHaveBeenCalled()
    });
    
    it("reads the declaration file over typings file if both passed in", function(this: This) {
        this.readFileMethod.and.callFake((file: string) => {
            return "";    
        });
        this.accessMethod.and.callFake(() => {
            return true;
        })
        let module = new ast.Module("src.js", undefined, "different.d.ts", "typings.d.ts", false, "utf8");
        expect(this.createSourceFileMethod).toHaveBeenCalledTimes(1)
        expect(this.createSourceFileMethod).toHaveBeenCalledWith("different.d.ts", "", jasmine.anything(), jasmine.anything());
    });
    
    it("attempts to read the sourcemap, then the declaration file beside the input file if none specified", function(this: This) {
        this.readFileMethod.and.callFake((file: string) => {
            if(file == 'src.js.map') throw {code: 'ENOENT'};
            return "";    
        });
        this.accessMethod.and.callFake(() => {
            return true;
        })
        let module = new ast.Module("src.js", undefined, undefined, undefined, false, "utf8");
        expect(this.readFileMethod).toHaveBeenCalledWith("src.js.map", jasmine.anything());
        expect(this.readFileMethod).toHaveBeenCalledWith("src.d.ts", jasmine.anything());
    });
    
    it("parses the supplied file if source map and declaration file not found", function(this: This) {
        this.readFileMethod.and.callFake((file: string) => {
            if(file == 'src.js.map') throw {code: 'ENOENT'};
            return "";    
        });
        let module = new ast.Module("src.js", undefined, undefined, undefined, false, "utf8");
        expect(this.createSourceFileMethod).toHaveBeenCalledTimes(1)
        expect(this.createSourceFileMethod).toHaveBeenCalledWith("src.js", "", jasmine.anything(), jasmine.anything());
    });

    it("parses the files specified in the source map if found", function(this: This) {
        this.readFileMethod.and.callFake((file: string) => {
            return file != 'transpiled.js.map' ? '' : '{"sourceRoot": "", "sources": ["source1.ts", "source2.ts"]}';    
        });
        let module = new ast.Module("transpiled.js", undefined, undefined, undefined, false, "utf8");
        expect(this.createSourceFileMethod).toHaveBeenCalledTimes(2)
        expect(this.createSourceFileMethod).toHaveBeenCalledWith("source1.ts", "", jasmine.anything(), jasmine.anything());
        expect(this.createSourceFileMethod).toHaveBeenCalledWith("source2.ts", "", jasmine.anything(), jasmine.anything());
    });

    it("retains a source file if it contains exported declarations", function(this: This) {
        this.createSourceFileMethod.and.callThrough();
        this.readFileMethod.and.callFake((file: string) => {
            if(file == 'src.js.map') throw {code: 'ENOENT'};
            return "export let declaration";    
        });
        let module = new ast.Module("src.js", undefined, undefined, undefined, false, "utf8");
        expect(this.createSourceFileMethod).toHaveBeenCalledTimes(1);
        expect(module.files.length).toBe(1);
        expect(module.files[0].path.base).toBe("src.js");
    });
    
    it("does not retain a source file if it does not contains exported declarations", function(this: This) {
        this.createSourceFileMethod.and.callThrough();
        this.readFileMethod.and.callFake((file: string) => {
            if(file == 'src.js.map') throw {code: 'ENOENT'};
            return "let declaration";    
        });
        let module = new ast.Module("src.js", undefined, undefined, undefined, false, "utf8");
        expect(this.createSourceFileMethod).toHaveBeenCalledTimes(1);
        expect(module.files.length).toBe(0);
    });
});