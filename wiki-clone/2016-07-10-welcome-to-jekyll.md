### Global options:
| Option | Description | Type | Default |
| --- | --- | --- | --- |
|  -p, --project     |  Path to a xrails.json project config file (or to a directory containing one)  |  string |
|  -l, --logLevel    |  Set the complier log level  |   "debug", "info", "warning", "error" |  "warning" |
|  -h, --help        |  Show help  |  boolean |
|  -v, --version     |  Show version number  |  boolean |
|  --charset         |  The character set of the input files  |  string |  "utf8" |
|  --implicitExport  |  Expose all declarations found (by default only those marked with export are exposed)  |  boolean |  |  false |

### Swift options:
| Option | Description | Type | Default |
| --- | --- | --- | --- |
|  --swift                     |  Compile source to swift (enabled automatically if any swift option specified e.g. swift.outDir=gen) |
|  --swift.javascriptcore      |  Compile source to use the JavaScriptCore engine under the hood  |
|  --swift.bundleId            |  The id of the bundle containing the javascript source file, omit to use the main bundle  |  string |
|  --swift.omitArgumentLabels  |  Prefix all function arguments with _  |  boolean |  |  false |

### Java options:
| Option | Description | Type | Default |
| --- | --- | --- | --- |
|  --java              |  Compile source to java (enabled automatically if any java option specified e.g. java.outDir=gen) |
|  --java.nashorn      |  Compile source to use the Nashorn engine under the hood, requires Java SE/EE  |
|  --java.basePackage  |  The base package to root the output structure in  |  string |

### General options:
| Option | Description | Type | Default |
| --- | --- | --- | --- |
|  --outDir         |  Redirect output structure to a directory  |  string |  "." |
|  --noEmit         |  Do not emit complied output  |  boolean |  |  false |
|  --noEmitWrapper  |  Do not emit the wrapper for the specified JS engine in compiled output  |  boolean |  |  false |

### Examples:
| Option | Description |
| --- | --- |
|   ../src/main src.min.js --swift |         Compile to swift, outputting beside original source files |
|   ../src/main src.js --java.outDir java |  Compile to java, outputting to a java subdirectory |

General options can be applied globally or to any language or engine, e.g. swift.outDir or swift.javascriptcore.outDir