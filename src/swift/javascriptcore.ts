import {SwiftEmitter} from './swift'
import {Options} from 'yargs';
import {Module, SourceFile, Type, AnyType, ArrayType, Declaration, VariableDeclaration} from "../ast"

class JavaScriptCoreEmitter extends SwiftEmitter {
    
    protected header(resourcePath?: string): string {
        return !resourcePath  ? '' : `var this :JSInstance = try! JSContext().eval(${resourcePath})\n`;
    }
    
    protected declaration(declaration: Declaration): string {
        return `${declaration.definition()} ${declaration.body()}`;
    }

    protected footer(identifiers?: Set<string>): string {
        let lines: string[] = [];
        if(identifiers) {
            lines.push('extension JSProperty {')
            for(let identifier of identifiers!) {
                lines.push(`\tstatic let ${identifier}: JSProperty = "${identifier}"`);
            }
            lines.push('}\n')
        }
        return lines.join('\n');
    }    
}

export default new JavaScriptCoreEmitter(); 

declare module "../ast" {
    interface Declaration {
        body(): string
    }
    interface Type {
        arrayElementReturnValue(optional?: boolean): string;
        returnValue(declaration: VariableDeclaration): string;
        argumentValue(declaration: VariableDeclaration): string;
        arrayElementArgumentValue(): string;
    }
}

VariableDeclaration.prototype.body = function (this: VariableDeclaration) {
    return this.constant ? `= ${this.type.returnValue(this)}` : 
`{
    get {
        return ${this.type.returnValue(this)}
    }
    set {
        this[.${this.name}] = ${this.type.argumentValue(this)}
    }
}`        
}

AnyType.prototype.returnValue = function(this: AnyType, declaration: VariableDeclaration) {
    return !this.optional ? `this[.${declaration.name}].infer()` : `Any?(this[.${declaration.name}], wrapped: JSValue.infer)`;    
}

ArrayType.prototype.returnValue = function(this: ArrayType, declaration: VariableDeclaration) {
    return this.optional ? `${this.signature()}(this[.${declaration.name}], wrapped: ${this.arrayElementReturnValue(false)})` : 
        `${this.signature()}(this[.${declaration.name}], element: ${this.typeArguments[0].arrayElementReturnValue()})`; 
}

Type.prototype.returnValue = function(this: Type, declaration: VariableDeclaration) {
    return !this.optional ? `${this.signature()}(this[.${declaration.name}])` : 
        `${this.signature()}(this[.${declaration.name}], wrapped: ${this.signature(false)}.init)`;    
}

AnyType.prototype.arrayElementReturnValue = function(this: AnyType, optional: boolean = this.optional) {
    return !optional ? `JSValue.infer` : `{ Any?($0, wrapped: JSValue.infer) }`;    
}

ArrayType.prototype.arrayElementReturnValue = function(this: ArrayType, optional: boolean = this.optional) {
    return `{ ${this.signature(optional)}($0, element: ${this.typeArguments[0].arrayElementReturnValue()}) }`;    
}

Type.prototype.arrayElementReturnValue = function(this: Type, optional: boolean = this.optional) {
    return !optional ? `${this.signature(optional)}.init` : `{ ${this.signature(optional)}($0, wrapped: ${this.signature(false)}.init) }`;    
}

Type.prototype.argumentValue = function(this: Type, declaration: VariableDeclaration) {
    return `this.valueOf(newValue${this.optional ? `, wrapped: ${this.arrayElementArgumentValue()})` : `)`}`;    
}

ArrayType.prototype.argumentValue = function(this: ArrayType, declaration: VariableDeclaration) {
    return this.optional ? Type.prototype.argumentValue.call(this, declaration) : 
        `this.valueOf(newValue, element: ${this.typeArguments[0].arrayElementArgumentValue()})`;    
}

Type.prototype.arrayElementArgumentValue = function(this: Type) {
    return `this.valueOf`;    
}

ArrayType.prototype.arrayElementArgumentValue = function(this: ArrayType) {
    return `{ this.valueOf($0, element: ${this.typeArguments[0].arrayElementArgumentValue()}) }`;    
}
