/**
 * Created by nbransby on 21/02/2016.
 */
class SimpleObject {

    static staticVoidNoArgMethod() {
        this.staticVoidNoArgMethodCalled = true
    }

    constructor(v) {
        this.value = v ? v : 7
    }

    numberSingleObjectArgMethod(a) {
        return a.value * this.value;
    }

    /**
     * @returns {Object}
     */
    upcastThisToObject() {
        return this;
    }
}

/**
 * @type {!SimpleClass}
 */
const simpleObjectInstance = new SimpleObject;
