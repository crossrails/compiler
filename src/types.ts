import {readFileSync} from 'fs';
import * as Path from 'path';
//import * as doctrine from 'doctrine';
import * as ts from "typescript";
import * as ast from "./ast/ast";
import log from "./log" 

export class Type implements ast.Type {
    readonly optional: boolean
    
    constructor(optional: boolean) {
        this.optional = optional;
    }
    
    static from(type: ts.TypeNode, optional: boolean): Type {
        try {
            switch(type.kind) {
                case ts.SyntaxKind.AnyKeyword:
                    return new AnyType(optional);
                case ts.SyntaxKind.BooleanKeyword:
                    return new BooleanType(optional);
                case ts.SyntaxKind.NumberKeyword:
                    return new NumberType(optional);
                case ts.SyntaxKind.StringKeyword:
                    return new StringType(optional);
                case ts.SyntaxKind.TypeReference:
                    return Type.fromReference(type as ts.TypeReferenceNode, optional);
                case ts.SyntaxKind.UnionType:
                    return Type.fromUnion(type as ts.UnionTypeNode);
                default:
                    throw `Unsupported type ${ts.SyntaxKind[type.kind]}`;                
            }
        } catch(error) {
            log.warn(`${error}, erasing to Any`, type);
            return new AnyType(optional);
        }
    }
    
    static fromReference(reference: ts.TypeReferenceNode, optional: boolean) {
        let identifier = reference.typeName as ts.Identifier
        switch(identifier.text) {
            case 'Array':
                return new ArrayType(reference, optional);
            default:
                throw `Unsupported type reference ${identifier.text}`
        }
    }
        
    static fromUnion(union: ts.UnionTypeNode) {
        if(union.types.length == 2) {
            if(union.types[0].kind == ts.SyntaxKind.NullKeyword || union.types[0].kind == ts.SyntaxKind.UndefinedKeyword) {
                return Type.from(union.types[1], true);
            } else if(union.types[1].kind == ts.SyntaxKind.NullKeyword || union.types[1].kind == ts.SyntaxKind.UndefinedKeyword) {
                return Type.from(union.types[0], true);                        
            }
        }
        throw `Unsupported type union, only unions between null or undefined and a single type supported`
    }  
}  

export class GenericType extends Type implements ast.GenericType {
    
    readonly typeArguments: ReadonlyArray<Type>
    
    constructor(type: ts.TypeReferenceNode, optional: boolean) {
        super(optional);
        let typeArguments: Type[] = [];
        for (let typeArgument of type.typeArguments) {
            typeArguments.push(Type.from(typeArgument, false))
        }
        this.typeArguments = typeArguments;      
    }  
}       

export class AnyType extends Type implements ast.AnyType {
    
}

export class StringType extends Type implements ast.StringType {
    
}

export class NumberType extends Type implements ast.NumberType {
    
}

export class BooleanType extends Type implements ast.BooleanType {
    
}

export class ArrayType extends GenericType implements ast.ArrayType {
    
}

