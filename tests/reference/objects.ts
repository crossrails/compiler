/**
 * Created by nbransby on 21/02/2016.
 */
class SimpleObject {
    
    private static staticVoidNoArgMethodCalled: boolean
    
    private readonly value: number
    private methodToOverrideCalled: boolean

    constructor(v?: number) {
        this.value = v ? v : 7
        this.methodToOverrideCalled = false
    }

    static staticVoidNoArgMethod(): void {
        this.staticVoidNoArgMethodCalled = true
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
const simpleObjectInstance: SimpleObject = new SimpleObject;

/**
 * @type {!Object}
 */
const anyObjectInstance: any = simpleObjectInstance;

/**
 * @type {?Object}
 */
var optionalAnyObjectInstance: any|undefined = new SimpleObject;

var simpleInterfaceInstanceCalled: boolean = false

interface SimpleInterface {
    voidNoArgMethod(): void
}

/**
 * @type {!}
 */
var simpleInterfaceInstance: SimpleInterface = {
    voidNoArgMethod(): void {
        simpleInterfaceInstanceCalled = true
    }
};

/**
 * @param a
 */
function acceptSimpleInterface(simpleInterface: SimpleInterface): void {
    simpleInterfaceInstance = simpleInterface;
    simpleInterface.voidNoArgMethod();
}
