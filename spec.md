Usage: src/main [file.js] [options]

Global options:
  -p, --project   Path to a xrails.json project config file (or to a directory containing one)  [string]
  -l, --logLevel  Set the complier log level  [choices: "debug", "info", "warning", "error"] [default: "warning"]
  -h, --help      Show help  [boolean]
  -v, --version   Show version number  [boolean]

Swift options:
  --swift                     Compile source to swift (enabled automatically if any swift option specified e.g. swift.outDir=gen)
  --swift.javascriptcore      Compile source to use the JavaScriptCore engine under the hood [default]
  --swift.bundleId            The id of the bundle containing the javascript source file, omit to use the main bundle  [string]
  --swift.omitArgumentLabels  Prefix all function arguments with _  [boolean] [default: false]

Java options:
  --java              Compile source to java (enabled automatically if any java option specified e.g. java.outDir=gen)
  --java.nashorn      Compile source to use the Nashorn engine under the hood, requires Java SE/EE [default]
  --java.basePackage  The base package to root the output structure in  [string]

General options:
  --outDir         Redirect output structure to a directory  [string] [default: "."]
  --noEmit         Do not emit complied output  [boolean] [default: false]
  --noEmitWrapper  Do not emit the wrapper for the specified JS engine in compiled output  [boolean] [default: false]

Options:
  --charset         The character set of the input files  [string] [default: "utf8"]
  --implicitExport  Expose all declarations found (by default only those marked with export are exposed)  [boolean] [default: false]

Examples:
  src/main src.min.js --swift         Compile to swift, outputting beside original source files
  src/main src.js --java.outDir java  Compile to java, outputting to a java subdirectory

General options can be applied globally or to any language or engine, e.g. swift.outDir or swift.javascriptcore.outDir

