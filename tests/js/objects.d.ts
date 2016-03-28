/**
 * Created by nbransby on 21/02/2016.
 */
export declare class SimpleObject {
    private static staticVoidNoArgMethodCalled;
    private readonly value;
    private methodToOverrideCalled;
    static staticVoidNoArgMethod(): void;
    constructor(v?: number);
    numberSingleObjectArgMethod(a: SimpleObject): number;
    callOverriddenMethod(): void;
    methodToOverride(): void;
    /**
     * @returns {Object}
     */
    upcastThisToObject(): any;
}
/**
 * @type {!SimpleObject}
 */
export declare const simpleObjectInstance: SimpleObject;
/**
 * @type {!Object}
 */
export declare const anyObjectInstance: SimpleObject;
/**
 * @type {?Object}
 */
export declare var optionalAnyObjectInstance: SimpleObject;
export declare var simpleInterfaceInstanceCalled: boolean;
/**
 * @type {!}
 */
export declare var simpleInterfaceInstance: {
    voidNoArgMethod(): void;
};
/**
 * @param a
 */
export declare function acceptSimpleInterface(simpleInterface: {
    voidNoArgMethod(): void;
}): void;
