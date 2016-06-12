//constants
/**
 * @type {!boolean}
 */
var booleanConst = false;
/**
 * @type {!number}
 */
var numberConst = Number.NaN;
/**
 * @type {!string}
 */
var stringConst = 'stringConstLiteral';
/**
 * @type {!Array<?number>}
 */
var numberOrNullArrayConst = [1, null, 3];
/**
 * @type {!Array<number>}
 */
var numberArrayConst = [1, 2, 3];
/**
 * @type {!Array<Array<string>>}
 */
var stringArrayArrayConst = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']];
/**
 * @type {!Object}
 */
var anyConst = 'anyConstLiteral';
//nullable constants
/**
 * @type {?boolean}
 */
var optionalBooleanConst = null;
/**
 * @type {?number}
 */
var optionalNumberConst = null;
/**
 * @type {?string}
 */
var optionalStringConst = null;
/**
 * @type {?Array<number>}
 */
var optionalNumberArrayConst = null;
/**
 * @type {?Object}
 */
var optionalNullAnyConst = null;
/**
 * @type {?Object}
 */
var optionalNonNullAnyConst = stringConst;
//variables
/**
 * @type {!boolean}
 */
var booleanVar = true;
/**
 * @type {!number}
 */
var numberVar = 0;
/**
 * @type {!string}
 */
var stringVar = "stringVarLiteral";
/**
 * @type {!Array<number>}
 */
var numberArrayVar = [];
/**
 * @type {!Object}
 */
var anyVar = "anyVarLiteral";
/**
 * @type {!Array<Array<string>>}
 */
var stringArrayArrayVar = [];
//nullable variables
/**
 * @type {?boolean}
 */
var optionalBooleanVar;
/**
 * @type {?number}
 */
var optionalNumberVar;
/**
 * @type {?string}
 */
var optionalStringVar;
/**
 * @type {?Array<number>}
 */
var optionalNumberArrayVar;
/**
 * @type {?Object}
 */
var optionalAnyVar;
var voidNoArgFunctionCalled = false;
function voidNoArgFunction() {
    voidNoArgFunctionCalled = true;
}
/**
 * @returns string
 */
function stringNoArgFunction() {
    return "stringNoArgFunctionReturnValue";
}
/**
 * @param a: number
 * @param b: number
 * @returns number
 */
function numberMultipleArgFunction(a, b) {
    return a * b;
}
/**
 * @type {function(): string}
 */
var stringNoArgLambda = function () {
    return "stringNoArgLambdaReturnValue";
};
/**
 * @throws Error
 */
function throwSimpleError() {
    throw new Error("Simple error message");
}
var SpecialError = (function () {
    function SpecialError(message) {
        this.message = message;
        this.message = message;
    }
    return SpecialError;
}());
/**
 * @throws SpecialError
 */
function throwSpecialError() {
    throw new SpecialError("Special error message");
}
/**
 * Created by nbransby on 21/02/2016.
 */
var SimpleObject = (function () {
    function SimpleObject(v) {
        this.value = v ? v : 7;
        this.methodToOverrideCalled = false;
    }
    SimpleObject.staticVoidNoArgMethod = function () {
        this.staticVoidNoArgMethodCalled = true;
    };
    SimpleObject.prototype.numberSingleObjectArgMethod = function (a) {
        return a.value * this.value;
    };
    SimpleObject.prototype.callOverriddenMethod = function () {
        this.methodToOverride();
    };
    SimpleObject.prototype.methodToOverride = function () {
        this.methodToOverrideCalled = true;
    };
    /**
     * @returns {Object}
     */
    SimpleObject.prototype.upcastThisToObject = function () {
        return this;
    };
    return SimpleObject;
}());
/**
 * @type {!SimpleObject}
 */
var simpleObjectInstance = new SimpleObject;
/**
 * @type {!Object}
 */
var anyObjectInstance = simpleObjectInstance;
/**
 * @type {?Object}
 */
var optionalAnyObjectInstance = new SimpleObject;
var simpleInterfaceInstanceCalled = false;
/**
 * @type {!}
 */
var simpleInterfaceInstance = {
    voidNoArgMethod: function () {
        simpleInterfaceInstanceCalled = true;
    }
};
/**
 * @param a
 */
function acceptSimpleInterface(simpleInterface) {
    simpleInterfaceInstance = simpleInterface;
    simpleInterface.voidNoArgMethod();
}
//# sourceMappingURL=src.js.map