"use strict";
var Swift = (function () {
    function Swift() {
    }
    Swift.prototype.emitModule = function (node, out) {
        out.emitChildren();
    };
    Swift.prototype.emitSourceFile = function (node, out) {
        //insert header comment
        out.writeFile(node.filename + ".swift", "import Foundation\n");
        out.emitChildren();
    };
    Swift.prototype.emitVariable = function (node, out) {
        //public let name :Any        
    };
    Swift.prototype.emitClass = function (node, out) {
    };
    Swift.prototype.emitMethod = function (node, out) {
    };
    return Swift;
}());
module.exports = new Swift();
//# sourceMappingURL=swift.js.map