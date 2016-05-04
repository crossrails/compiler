import {readFileSync} from 'fs';
import * as Path from 'path';
//import * as doctrine from 'doctrine';
import * as ts from "typescript";
import log from "./log" 
import {Type, AnyType, BooleanType, NumberType, StringType, GenericType, ArrayType} from "./ast";

declare module "./ast" {
    namespace Type {
        function from(type: ts.TypeNode, optional?: boolean): Type
        function fromReference(reference: ts.TypeReferenceNode, optional: boolean): Type
        function fromUnion(union: ts.UnionTypeNode): Type
    }
    namespace GenericType {
        function from(type: ts.TypeReferenceNode, optional: boolean): Type
    }
}

Type.from = function(type: ts.TypeNode, optional: boolean): Type {
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

Type.fromReference = function(reference: ts.TypeReferenceNode, optional: boolean) {
    let identifier = reference.typeName as ts.Identifier
    switch(identifier.text) {
        case 'Array':
            return ArrayType.from(reference, optional);
        default:
            throw `Unsupported type reference ${identifier.text}`
    }
}
      
Type.fromUnion = function(union: ts.UnionTypeNode) {
    if(union.types.length == 2) {
        if(union.types[0].kind == ts.SyntaxKind.NullKeyword || union.types[0].kind == ts.SyntaxKind.UndefinedKeyword) {
            return Type.from(union.types[1], true);
        } else if(union.types[1].kind == ts.SyntaxKind.NullKeyword || union.types[1].kind == ts.SyntaxKind.UndefinedKeyword) {
            return Type.from(union.types[0], true);                        
        }
    }
    throw `Unsupported type union, only unions between null or undefined and a single type supported`
}  

GenericType.from = function(type: ts.TypeReferenceNode, optional?: boolean): GenericType {
    let typeArguments: Type[] = [];
    for (let typeArgument of type.typeArguments) {
        typeArguments.push(Type.from(typeArgument))
    }
    this.typeArguments = typeArguments;      
    return new GenericType(optional, typeArguments);  
}       
