"use strict";
/// <reference path="../typings/main/ambient/acorn/index.d.ts" />
/// <reference path="../typings/main/ambient/node/index.d.ts" />
var fs_1 = require('fs');
var acorn = require('acorn');
console.log(acorn.parse(fs_1.readFileSync(process.argv[2]).toString()));
console.log("None");
//# sourceMappingURL=main.js.map