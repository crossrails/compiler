import * as fs from 'fs';

describe("Main", () => {
    
    interface This {
        writeFileMethod: jasmine.Spy;            
        exitMethod: jasmine.Spy;            
    }
    
    beforeEach(function(this: This) {
        this.writeFileMethod = spyOn(fs, 'writeFileSync');
        this.exitMethod = spyOn(process, "exit");
    });
        
    // it("fails when non js file arg given", function(this: This) {
    //     process.argv = ['node', 'main', `types.ts`, "--swift"]
    //     require('../../src/main');
    //     expect(this.writeFileMethod).not.toHaveBeenCalled()
    //     expect(this.exitMethod).toHaveBeenCalledWith(1);
    // });
    
    it("successfully compiles the reference project", function(this: This) {
        process.argv = ['node', 'main', `./tests/reference/types.js`, "--swift"]
        require('../../src/main');
        expect(this.writeFileMethod).toHaveBeenCalledTimes(1)
        expect(this.writeFileMethod).toHaveBeenCalledWith(jasmine.stringMatching(/tests[\\\/]reference[\\\/]types\.swift/), jasmine.stringMatching(/optionalBooleanConst/));        
        expect(this.exitMethod).toHaveBeenCalledWith(0);
    });
        
});
