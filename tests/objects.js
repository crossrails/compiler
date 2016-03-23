/**
 * Created by nbransby on 21/02/2016.
 */
class SimpleObject {

    static staticVoidNoArgMethod() {
        this.staticVoidNoArgMethodCalled = true
    }

    constructor(v) {
        this.value = v ? v : 7
        this.methodToOverrideCalled = false
    }

    numberSingleObjectArgMethod(a) {
        return a.value * this.value;
    }

    callOverriddenMethod() {
        this.methodToOverride()
    }

    methodToOverride() {
        this.methodToOverrideCalled = true
    }

    /**
     * @returns {Object}
     */
    upcastThisToObject() {
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
function acceptSimpleInterface(simpleInterface) {
    simpleInterfaceInstance = simpleInterface;
    simpleInterface.voidNoArgMethod();
}
