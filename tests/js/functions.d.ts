export declare var voidNoArgFunctionCalled: boolean;
export declare function voidNoArgFunction(): void;
/**
 * @returns string
 */
export declare function stringNoArgFunction(): string;
/**
 * @param a: number
 * @param b: number
 * @returns number
 */
export declare function numberMultipleArgFunction(a: number, b: number): number;
/**
 * @type {function(): string}
 */
export declare var stringNoArgLambda: () => string;
/**
 * @throws Error
 */
export declare function throwSimpleError(): void;
export declare class SpecialError {
    private message;
    constructor(message: string);
}
/**
 * @throws SpecialError
 */
export declare function throwSpecialError(): void;
