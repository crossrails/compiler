// import {SwiftEmitter} from './swift'
// import {Module, SourceFile, Type, AnyType, ArrayType, Declaration, VariableDeclaration, ClassDeclaration} from "../ast"

// class JavaScriptCoreEmitter extends SwiftEmitter {
    
//     protected header(resourcePath?: string): string {
//         return !resourcePath  ? '' : `var this :JSInstance = try! JSContext().eval(${resourcePath})\n`;
//     }
    
//     protected declaration(declaration: Declaration): string {
//         return `${declaration.definition()} ${declaration.body()}`;
//     }

//     protected footer(identifiers?: ReadonlyArray<string>): string {
//         let lines: string[] = [];
//         if(identifiers) {
//             lines.push('extension JSProperty {')
//             for(let identifier of identifiers! as Array<string>) {
//                 lines.push(`\tstatic let ${identifier}: JSProperty = "${identifier}"`);
//             }
//             lines.push('}\n')
//         }
//         return lines.join('\n');
//     }    
// }

// export default new JavaScriptCoreEmitter(); 

// declare module "../ast" {
//     interface Declaration {
//         body(): string
//     }
//     interface Type {
//         arrayElementReturnValue(optional?: boolean): string;
//         returnValue(): string;
//         argumentValue(): string;
//         arrayElementArgumentValue(): string;
//     }
// }

// VariableDeclaration.prototype.body = function (this: VariableDeclaration) {
//     return this.constant ? `= ${this.type.returnValue()}` : 
// `{
//     get {
//         return ${this.type.returnValue()}
//     }
//     set {
//         this[.${this.name}] = ${this.type.argumentValue()}
//     }
// }`        
// }

// ClassDeclaration.prototype.body = function (this: ClassDeclaration): string {
//     return "";
// }

// AnyType.prototype.returnValue = function(this: AnyType) {
//     return !this.optional ? `this[.${this.parent.name}].infer()` : `Any?(this[.${this.parent.name}], wrapped: { $0.infer() })`;    
// }

// ArrayType.prototype.returnValue = function(this: ArrayType) {
//     return this.optional ? `${this.typeSignature()}(this[.${this.parent.name}], wrapped: ${this.arrayElementReturnValue(false)})` : 
//         `${this.typeSignature()}(this[.${this.parent.name}], element: ${this.typeArguments[0].arrayElementReturnValue()})`; 
// }

// Type.prototype.returnValue = function(this: Type) {
//     return !this.optional ? `${this.typeSignature()}(this[.${this.parent.name}])` : 
//         `${this.typeSignature()}(this[.${this.parent.name}], wrapped: ${this.typeSignature(false)}.init)`;    
// }

// AnyType.prototype.arrayElementReturnValue = function(this: AnyType, optional: boolean = this.optional) {
//     return !optional ? `JSValue.infer` : `{ Any?($0, wrapped: JSValue.infer) }`;    
// }

// ArrayType.prototype.arrayElementReturnValue = function(this: ArrayType, optional: boolean = this.optional) {
//     return `{ ${this.typeSignature(optional)}($0, element: ${this.typeArguments[0].arrayElementReturnValue()}) }`;    
// }

// Type.prototype.arrayElementReturnValue = function(this: Type, optional: boolean = this.optional) {
//     return !optional ? `${this.typeSignature(optional)}.init` : `{ ${this.typeSignature(optional)}($0, wrapped: ${this.typeSignature(false)}.init) }`;    
// }

// Type.prototype.argumentValue = function(this: Type) {
//     return `this.valueOf(newValue${this.optional ? `, wrapped: ${this.arrayElementArgumentValue()})` : `)`}`;    
// }

// ArrayType.prototype.argumentValue = function(this: ArrayType) {
//     return this.optional ? Type.prototype.argumentValue.call(this, this.parent) : 
//         `this.valueOf(newValue, element: ${this.typeArguments[0].arrayElementArgumentValue()})`;    
// }

// Type.prototype.arrayElementArgumentValue = function(this: Type) {
//     return `this.valueOf`;    
// }

// ArrayType.prototype.arrayElementArgumentValue = function(this: ArrayType) {
//     return `{ this.valueOf($0, element: ${this.typeArguments[0].arrayElementArgumentValue()}) }`;    
// }
