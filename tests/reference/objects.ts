/**
 * Created by nbransby on 21/02/2016.
 */
class SimpleObject {
    
    private static staticVoidNoArgMethodCalled: boolean
    
    private readonly value: number
    private methodToOverrideCalled: boolean

    static staticVoidNoArgMethod() {
        this.staticVoidNoArgMethodCalled = true
    }
    
    constructor(v?: number) {
        this.value = v ? v : 7
        this.methodToOverrideCalled = false
    }

    numberSingleObjectArgMethod(a: SimpleObject): number {
        return a.value * this.value;
    }

    callOverriddenMethod(): void {
        this.methodToOverride()
    }

    methodToOverride(): void {
        this.methodToOverrideCalled = true
    }

    /**
     * @returns {Object}
     */
    upcastThisToObject(): any {
        return this;
    }
}

/**
 * @type {!SimpleObject}
 */
const simpleObjectInstance = new SimpleObject;

/**
 * @type {!Object}
 */
const anyObjectInstance = simpleObjectInstance;

/**
 * @type {?Object}
 */
var optionalAnyObjectInstance = new SimpleObject;

var simpleInterfaceInstanceCalled = false

/**
 * @type {!}
 */
var simpleInterfaceInstance = {
    voidNoArgMethod() {
        simpleInterfaceInstanceCalled = true
    }
};

/**
 * @param a
 */
function acceptSimpleInterface(simpleInterface: { voidNoArgMethod(): void }) {
    simpleInterfaceInstance = simpleInterface;
    simpleInterface.voidNoArgMethod();
}
