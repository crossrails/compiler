var voidNoArgFunctionCalled: boolean = false

function voidNoArgFunction(): void {
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
var stringNoArgLambda: () => string = () => "stringNoArgLambdaReturnValue";


/**
 * @throws {Error}
 */
function throwSimpleError(): void {
    throw new Error("Simple error message")
}

class SpecialError {
    message: string

    constructor(message: string) {
        this.message = message
    }
}

/**
 * @throws {SpecialError}
 */
function throwSpecialError(): void {
    throw new SpecialError("Special error message")
}