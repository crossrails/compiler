export var voidNoArgFunctionCalled = false

export function voidNoArgFunction() {
    voidNoArgFunctionCalled = true
}

/**
 * @returns string
 */
export function stringNoArgFunction(): string {
    return "stringNoArgFunctionReturnValue"
}

/**
 * @param a: number
 * @param b: number
 * @returns number
 */
export function numberMultipleArgFunction(a: number, b: number): number {
    return a * b;
}

/**
 * @type {function(): string}
 */
export var stringNoArgLambda = function(): string {
    return "stringNoArgLambdaReturnValue"
}

/**
 * @throws Error
 */
export function throwSimpleError() {
    throw new Error("Simple error message")
}

export class SpecialError {

    constructor(private message: string) {
        this.message = message
    }
}

/**
 * @throws SpecialError
 */
export function throwSpecialError() {
    throw new SpecialError("Special error message")
}