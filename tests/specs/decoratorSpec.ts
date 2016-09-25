import {decorate, undecorate} from "../../src/decorator"

interface Target {    
    newMethod() : string
}

class ConcreteTarget  {    
     exitingMethod(): string {
         return 'orginalReturnValue'
     }
}

describe("Decorator", () => {

    interface This {
    }

    
    beforeEach(function(this: This) {
    });
    
    it("adds/removes properties set in decorator to/from the target", function(this: This) {
        let target: Target = Object.create(ConcreteTarget.prototype) as any;
        decorate(ConcreteTarget, ({prototype}: any) => prototype.newMethod = () => 'returnValue')
        expect(target.newMethod()).toBe('returnValue');
        undecorate();
        expect(target.newMethod).toBeUndefined();
    });

    it("overwrites/restores properties already defined in the target", function(this: This) {
        let target = new ConcreteTarget();
        decorate(ConcreteTarget, ({prototype}) => prototype.exitingMethod = () => 'returnValue')
        expect(target.exitingMethod()).toBe('returnValue');
        undecorate();
        expect(target.exitingMethod()).toBe('orginalReturnValue');
    });

});