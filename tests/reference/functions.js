"use strict";
exports.voidNoArgFunctionCalled = false;
function voidNoArgFunction() {
    exports.voidNoArgFunctionCalled = true;
}
exports.voidNoArgFunction = voidNoArgFunction;
/**
 * @returns string
 */
function stringNoArgFunction() {
    return "stringNoArgFunctionReturnValue";
}
exports.stringNoArgFunction = stringNoArgFunction;
/**
 * @param a: number
 * @param b: number
 * @returns number
 */
function numberMultipleArgFunction(a, b) {
    return a * b;
}
exports.numberMultipleArgFunction = numberMultipleArgFunction;
/**
 * @type {function(): string}
 */
exports.stringNoArgLambda = function () {
    return "stringNoArgLambdaReturnValue";
};
/**
 * @throws Error
 */
function throwSimpleError() {
    throw new Error("Simple error message");
}
exports.throwSimpleError = throwSimpleError;
class SpecialError {
    constructor(message) {
        this.message = message;
        this.message = message;
    }
}
exports.SpecialError = SpecialError;
/**
 * @throws SpecialError
 */
function throwSpecialError() {
    throw new SpecialError("Special error message");
}
exports.throwSpecialError = throwSpecialError;
//# sourceMappingURL=functions.js.map