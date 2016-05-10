"use strict";
var JavaScriptCore = (function () {
    function JavaScriptCore() {
    }
    JavaScriptCore.prototype.emitModule = function (node, out) {
        //copy in js.swift
        //create module_name.swift and add script loader
        //add extension JSProperty {}
        //define global this 
        out.emitChildren();
    };
    JavaScriptCore.prototype.emitSourceFile = function (node, out) {
        //insert header comment
        out.writeFile(node.filename + ".swift", "import Foundation\n");
        out.emitChildren();
    };
    JavaScriptCore.prototype.emitClass = function (node, out) {
    };
    JavaScriptCore.prototype.emitMethod = function (node, out) {
    };
    JavaScriptCore.prototype.emitVariable = function (node, out) {
        // = this[.name].infer()
    };
    return JavaScriptCore;
}());
module.exports = new JavaScriptCore();
//# sourceMappingURL=javascriptcore.js.map