import * as fs from 'fs';

describe("Main", () => {
    
    interface This {
        writeFileMethod: jasmine.Spy;            
    }
    
    beforeEach(function(this: This) {
        this.writeFileMethod = spyOn(fs, 'writeFileSync');
    });
        
    it("fails when non js file arg given", function(this: This) {
        try {
            require('../../src/main')(
                `types.ts`, 
                '--swift'
            );
            fail("did not fail");
        } catch(e) {
            expect(e).toMatch('must be a js source file')
            expect(this.writeFileMethod).not.toHaveBeenCalled()
        }
    });
    
    it("successfully compiles the reference project", function(this: This) {
        let exitCode = require('../../src/main')(
            './tests/reference/types.js', 
            '--swift'
        );
        expect(exitCode).toBe(0);
        expect(this.writeFileMethod).toHaveBeenCalledTimes(1)
        expect(this.writeFileMethod).toHaveBeenCalledWith(jasmine.stringMatching(/tests[\\\/]reference[\\\/]types\.swift/), jasmine.stringMatching(/optionalBooleanConst/));        
    });
        
});
