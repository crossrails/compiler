var voidNoArgFunctionCalled = false

function voidNoArgFunction() {
    voidNoArgFunctionCalled = true
}

/**
 * @returns string
 */
function stringNoArgFunction(): string {
    return "stringNoArgFunctionReturnValue"
}

/**
 * @param a: number
 * @param b: number
 * @returns number
 */
function numberMultipleArgFunction(a: number, b: number): number {
    return a * b;
}

/**
 * @type {function(): string}
 */
var stringNoArgLambda = function(): string {
    return "stringNoArgLambdaReturnValue"
}

/**
 * @throws Error
 */
function throwSimpleError() {
    throw new Error("Simple error message")
}

class SpecialError {

    constructor(private message: string) {
        this.message = message
    }
}

/**
 * @throws SpecialError
 */
function throwSpecialError() {
    throw new SpecialError("Special error message")
}