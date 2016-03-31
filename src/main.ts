/// <reference path="../typings/main/ambient/acorn/index.d.ts" />
/// <reference path="../typings/main/ambient/node/index.d.ts" />
import {readFileSync} from 'fs';
import * as acorn from 'acorn';

console.log(acorn.parse(readFileSync(process.argv[2]).toString()));
console.log("None");