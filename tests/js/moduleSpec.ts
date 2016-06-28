import * as fs from 'fs';
import * as rewire from 'rewire';
import * as ts from "typescript";
import * as AST from "../../src/ast"
import {log} from "../../src/log"

let ast = rewire<typeof AST>('../../src/ast');

describe("Module", () => {
    
    interface This {
        readFileMethod: jasmine.Spy;            
        createSourceFileMethod: jasmine.Spy;            
    }
    
    beforeEach(function(this: This) {
        this.readFileMethod = spyOn(fs, 'readFileSync');
        this.createSourceFileMethod = spyOn(ts, 'createSourceFile').and.callThrough();
    });
    
    it("throws file not found when module source file does not exist", function(this: This) {
        this.readFileMethod.and.callThrough();
        try {
            let module = new ast.Module("missingfile.js", false, "utf8");
            fail("Did not throw exception");
        } catch(error) {
            expect(error.code).toBe('ENOENT');
        }
    });

    it("parses the supplied file if source map not found", function(this: This) {
        this.readFileMethod.and.callFake((file: string) => {
            if(file == 'src.js.map') throw {code: 'ENOENT'};
            return "";    
        });
        let module = new ast.Module("src.js", false, "utf8");
        expect(this.createSourceFileMethod).toHaveBeenCalledTimes(1)
        expect(this.createSourceFileMethod).toHaveBeenCalledWith("src.js", "", jasmine.anything(), jasmine.anything());
    });

    it("parses the files specified in the source map if found", function(this: This) {
        this.readFileMethod.and.callFake((file: string) => {
            return file != 'transpiled.js.map' ? '' : '{"sourceRoot": "", "sources": ["source1.ts", "source2.ts"]}';    
        });
        let module = new ast.Module("transpiled.js", false, "utf8");
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
        let module = new ast.Module("src.js", false, "utf8");
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
        let module = new ast.Module("src.js", false, "utf8");
        expect(this.createSourceFileMethod).toHaveBeenCalledTimes(1);
        expect(module.files.length).toBe(0);
    });
});