import * as ts from "typescript";
import * as fs from "fs";

interface DocEntry {
    name?: string,
    fileName?: string,
    documentation?: string,
    type?: string,
    constructors?: DocEntry[],
    parameters?: DocEntry[],
    returnType?: string
};

/** Generate documention for all classes in a set of .ts files */
function generateDocumentation(fileNames: string[], options: ts.CompilerOptions): void {
    // Build a program using the set of root file names in fileNames
    const servicesHost: ts.LanguageServiceHost = {
        getScriptFileNames: () => ['main.ts'],
        getScriptVersion: (fileName) => '0',
        getScriptSnapshot: (fileName) => {
            return ts.ScriptSnapshot.fromString(`
            
                export interface Foo { 
                    protected foo: void
                }

                var a: Foo;
                /**
                 * @type {!Array<number>}
                 */                    
                export interface Foo { bar;};
                /**
                 * @type {!Array<number>}
                 */                    
                export class Foo {
                    bam;
                }

                export namespace Foo {
                    export class Dave {

                    }
                }

                export class Raa {
                    
                }
            `);
        },
        getCurrentDirectory: () => process.cwd(),
        getCompilationSettings: () => { return {allowJS: true}; },
        getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    };

    // Create the language service files
    const services = ts.createLanguageService(servicesHost, ts.createDocumentRegistry())
    const program = services.getProgram();
    // Get the checker, we will use it to find more about classes
    let checker = program.getTypeChecker();

    let output: DocEntry[] = [];

    // Visit every sourceFile in the program    
    for (const sourceFile of program.getSourceFiles()) {
        // Walk the tree to search for classes
        ts.forEachChild(sourceFile, visit);
    }

    // print out the doc
    console.log(JSON.stringify(output, undefined, 4));

    return;

    /** visit nodes finding exported classes */    
    function visit(node: ts.Node) {
        // Only consider exported nodes
        // if (!isNodeExported(node)) {
        //     return;
        // }
        console.log(ts.SyntaxKind[node.kind]);
        if (node.kind === ts.SyntaxKind.VariableDeclaration) {
            // This is a top level class, get its symbol
            let symbol = checker.getSymbolAtLocation((<ts.VariableDeclaration>node).name!);
            output.push(serializeClass(symbol));
            // No need to walk any further, class expressions/inner declarations
            // cannot be exported
        }
        else if (node.kind === ts.SyntaxKind.ModuleDeclaration || node.kind === ts.SyntaxKind.VariableDeclarationList || node.kind === ts.SyntaxKind.VariableStatement) {
            // This is a namespace, visit its children
            ts.forEachChild(node, visit);
        }
    }

    /** Serialize a symbol into a json object */    
    function serializeSymbol(symbol: ts.Symbol): DocEntry {
        return {
            name: symbol.getName(),
            documentation: ts.displayPartsToString(symbol.getDocumentationComment()),
            type: checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!))
        };
    }

    /** Serialize a class symbol infomration */
    function serializeClass(symbol: ts.Symbol) {
        let details = serializeSymbol(symbol);

        // Get the construct signatures
        let constructorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!);
        details.constructors = constructorType.getConstructSignatures().map(serializeSignature);
        return details;
    }

    /** Serialize a signature (call or construct) */
    function serializeSignature(signature: ts.Signature) {
        return {
            parameters: signature.parameters.map(serializeSymbol),
            returnType: checker.typeToString(signature.getReturnType()),
            documentation: ts.displayPartsToString(signature.getDocumentationComment())
        };
    }

    /** True if this is visible outside this file, false otherwise */
    function isNodeExported(node: ts.Node): boolean {
        return (node.flags & ts.NodeFlags.Export) !== 0 || (node.parent !== undefined && node.parent.kind === ts.SyntaxKind.SourceFile);
    }
}


describe("Playground", () => {
    
    it("TypeChecker", function() {
        // Create the language service host to allow the LS to communicate with the host
        const servicesHost: ts.LanguageServiceHost = {
            getScriptFileNames: () => ['main.js'],
            getScriptVersion: (fileName) => '0',
            getScriptKind: (fileName: string) => ts.ScriptKind.JS,
            getScriptSnapshot: (fileName) => {
                return ts.ScriptSnapshot.fromString(`
class Dave {}

// /**
//  * @type {Dave} 
//  */
// var dave;

// // namespace Tony {
// //     export interface Ant {}
// // }
// // var ant:Tony.Ant
                `);
            },
            getCurrentDirectory: () => process.cwd(),
            getCompilationSettings: () => { return {allowJS: true, removeComments: false}; },
            getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
        };

        // Create the language service files
        const services = ts.createLanguageService(servicesHost, ts.createDocumentRegistry())
        const program = services.getProgram();
        const checker = program.getTypeChecker();

        const map = new Map<string, Set<ts.Symbol>>();

        function visit(node: ts.Node) {
            console.log(ts.SyntaxKind[node.kind]);
            ts.forEachChild(node, visit);            
            const symbol = checker.getSymbolAtLocation(node);
            if(symbol == undefined) return;
            console.log(symbol.getDocumentationComment());
            const type = checker.getTypeOfSymbolAtLocation(symbol, node);
            if(type.symbol == undefined) return;
            const name = checker.typeToString(type, node.getSourceFile());
            console.log(name);
            for(let declaration of type.symbol!.declarations!) {
                let set = map.get(name);
                if(set == undefined) {
                    set = new Set();
                    map.set(name, set);
                }
                set.add(symbol);
                console.log(set.size);
            }
        }

        for (const sourceFile of program.getSourceFiles()) {
            visit(sourceFile);
        }
        // console.log(map.size);
        // console.log(map.entries().next());
        // console.log(map.values().next().value.size);

        const file = program.getSourceFiles()[0];
        // const declaration = file.statements[0] as ts.InterfaceDeclaration;
        // console.log(map.get(checker.symbolToString(checker.getSymbolAtLocation(declaration.name), declaration.getSourceFile()))!.forEach(
        //     t => console.log(t.name)))
        const reference = (file.statements[1] as ts.VariableStatement).declarationList.declarations[0];
        // const symbols = checker.getSymbolsInScope(file, ts.SymbolFlags.Type|ts.SymbolFlags.Namespace);
        // console.log(symbols.reduce((out, s) => `${out}${s.name}, `, ''));
        console.log((checker.getTypeAtLocation(reference).getSymbol().declarations![0].name as ts.Identifier).text)
         console.log(checker.getSymbolAtLocation(reference.name).getDocumentationComment());
        // console.log((declaration.name as ts.Identifier).text)
        // expect(checker.getTypeAtLocation(reference).getSymbol().declarations![0].pos).toEqual(declaration.pos)
    })

    // it("Example", function() {
    //     generateDocumentation(['test.ts'], {
    //         target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
    //     });

    // })
})

/*

in java if a namespace at the root has the same name as the module then merge its members with module members (create/update default module namespace)
or just remove namespaces with same name as module for all languages 

merge                               java                                            swift                                                       ast

interfaces                          single interface                                single protocol                                             interface
classes                             single class                                    single class                                                class
interface with class                class with abstract methods                     class with preconditionFail pattern for abstract methods    class
namespaces not nested in a type     package                                         struct with nested static members                           namespace
namespace with class                class with nested static members                class with nested static members                            class    
namespace with enum                 enum with nested static members                 enum with nested static members                             enum
namespace with function             method + class with nested static members       func + struct with nested static members                    function + class

*/