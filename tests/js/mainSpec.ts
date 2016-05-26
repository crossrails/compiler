
describe("Main", () => {
    
    it("successfuly compiles reference project", function() {
        process.argv = ['node', 'main', `./tests/reference/types.js`, "--swift", "--noEmit"]
        let exitMethod = spyOn(process, "exit");
        require('../../src/main');
        expect(exitMethod).toHaveBeenCalledWith(0);
    });
        
});