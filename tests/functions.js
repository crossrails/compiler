var voidNoArgFunctionCalled = false

function voidNoArgFunction() {
    voidNoArgFunctionCalled = true
}

/**
 * @returns string
 */
function stringNoArgFunction() {
    return "stringNoArgFunctionReturnValue"
}

/**
 * @param a: number
 * @param b: number
 * @returns string
 */
function numberMultipleArgFunction(a, b) {
    return a * b;
}

/**
 * @type {function(): string}
 */
var stringNoArgLambda = function () {
    return "stringNoArgLambdaReturnValue"

}

/**
 * @throws Error
 */
function throwSimpleError() {
    throw new Error("Simple error message")
}

class SpecialError {

    constructor(message) {
        this.message = message
    }
}

/**
 * @throws SpecialError
 */
function throwSpecialError() {
    throw new SpecialError("Special error message")
}