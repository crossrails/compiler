import * as fs from 'fs';

describe("Main", () => {
    
    it("successfuly compiles the reference project", function() {
        let writeFileMethod = spyOn(fs, 'writeFileSync');
        let exitMethod = spyOn(process, "exit");
        process.argv = ['node', 'main', `./tests/reference/types.js`, "--swift"]
        require('../../src/main');
        expect(writeFileMethod).toHaveBeenCalledTimes(1)
        expect(writeFileMethod).toHaveBeenCalledWith(jasmine.stringMatching(/tests[\\\/]reference[\\\/]types\.swift/), jasmine.stringMatching(/optionalBooleanConst/));        
        expect(exitMethod).toHaveBeenCalledWith(0);
    });
        
});
