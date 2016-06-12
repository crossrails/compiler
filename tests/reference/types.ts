//constants
/**
 * @type {!boolean}
 */
const booleanConst: boolean = false;
/**
 * @type {!number}
 */
const numberConst: number = Number.NaN;
/**
 * @type {!string}
 */
const stringConst: string = 'stringConstLiteral';
/**
 * @type {!Array<?number>}
 */
const numberOrNullArrayConst: (number|null)[] = [1, null, 3];
/**
 * @type {!Array<number>}
 */
const numberArrayConst: number[] = [1, 2, 3];
/**
 * @type {!Array<Array<string>>}
 */
const stringArrayArrayConst: Array<Array<string>> = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']];
/**
 * @type {!Object}
 */
const anyConst: any = 'anyConstLiteral';


//nullable constants
/**
 * @type {?boolean}
 */
const optionalBooleanConst: boolean|null = null
/**
 * @type {?number}
 */
const optionalNumberConst: number|null = null
/**
 * @type {?string}
 */
const optionalStringConst: string|null = null
/**
 * @type {?Array<number>}
 */
const optionalNumberArrayConst: Array<number>|null = null
/**
 * @type {?Object}
 */
const optionalNullAnyConst: any|null = null

/**
 * @type {?Object}
 */
const optionalNonNullAnyConst: any|null = stringConst


//variables
/**
 * @type {!boolean}
 */
var booleanVar: boolean = true
/**
 * @type {!number}
 */
var numberVar: number = 0
/**
 * @type {!string}
 */
var stringVar: string = "stringVarLiteral"
/**
 * @type {!Array<number>}
 */
var numberArrayVar: Array<number> = [];
/**
 * @type {!Object}
 */
var anyVar: any = "anyVarLiteral"
/**
 * @type {!Array<Array<string>>}
 */
var stringArrayArrayVar: Array<Array<string>> = [];


//nullable variables
/**
 * @type {?boolean}
 */
var optionalBooleanVar: boolean|null
/**
 * @type {?number}
 */
var optionalNumberVar: number|null
/**
 * @type {?string}
 */
var optionalStringVar: string|null
/**
 * @type {?Array<number>}
 */
var optionalNumberArrayVar: Array<number>|null
/**
 * @type {?Object}
 */
var optionalAnyVar: any|null
