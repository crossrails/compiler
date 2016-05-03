"use strict";
/**
 * Created by nbransby on 21/02/2016.
 */
class SimpleObject {
    constructor(v) {
        this.value = v ? v : 7;
        this.methodToOverrideCalled = false;
    }
    static staticVoidNoArgMethod() {
        this.staticVoidNoArgMethodCalled = true;
    }
    numberSingleObjectArgMethod(a) {
        return a.value * this.value;
    }
    callOverriddenMethod() {
        this.methodToOverride();
    }
    methodToOverride() {
        this.methodToOverrideCalled = true;
    }
    /**
     * @returns {Object}
     */
    upcastThisToObject() {
        return this;
    }
}
exports.SimpleObject = SimpleObject;
/**
 * @type {!SimpleObject}
 */
exports.simpleObjectInstance = new SimpleObject;
/**
 * @type {!Object}
 */
exports.anyObjectInstance = exports.simpleObjectInstance;
/**
 * @type {?Object}
 */
exports.optionalAnyObjectInstance = new SimpleObject;
exports.simpleInterfaceInstanceCalled = false;
/**
 * @type {!}
 */
exports.simpleInterfaceInstance = {
    voidNoArgMethod() {
        exports.simpleInterfaceInstanceCalled = true;
    }
};
/**
 * @param a
 */
function acceptSimpleInterface(simpleInterface) {
    exports.simpleInterfaceInstance = simpleInterface;
    simpleInterface.voidNoArgMethod();
}
exports.acceptSimpleInterface = acceptSimpleInterface;
//# sourceMappingURL=objects.js.map