
hello


### Global options:
| Option | Type | Description |
| --- | --- | --- |
| `  -p, --project     ` | `string` |  Path to a xrails.json project config file (or to a directory containing one)   |
| `  -l, --logLevel    ` | `choices: "debug", "info", "warning", "error"` |  Set the complier log level  , defaults to "warning" |
| `  -h, --help        ` | `boolean` |  Show help   |
| `  -v, --version     ` | `boolean` |  Show version number   |
| `  --charset         ` | `string` |  The character set of the input files  , defaults to "utf8" |
| `  --sourceMap       ` | `file.js` |  Path to the source map of the input file, defaults to [file.js].map , defaults to string |
| `  --declarationFile ` | `file.js` |  Path to a typescript declaration file (.d.ts), defaults to [file.js].d.ts , defaults to string |
| `  --implicitExport  ` | `boolean` |  Expose all declarations found (by default only those marked with export are exposed)  , defaults to false |

### Swift options:
| Option | Type | Description |
| --- | --- | --- |
| `  --swift                    ` | `null` |  Compile source to swift (enabled automatically if any swift option specified e.g. swift.emit=gen) |
| `  --swift.javascriptcore     ` | `default engine` |  Compile source to use the JavaScriptCore engine under the hood  |
| `  --swift.bundleId           ` | `string` |  The id of the bundle containing the JS source file, omit to use the main bundle   |
| `  --swift.omitArgumentLabels ` | `boolean` |  Prefix all function arguments with _ , defaults to false |

### Java options:
| Option | Type | Description |
| --- | --- | --- |
| `  --java             ` | `null` |  Compile source to java (enabled automatically if any java option specified e.g. java.emit=gen) |
| `  --java.nashorn     ` | `default` |  Compile source to use the Nashorn engine under the hood, requires Java SE/EE  |
| `  --java.basePackage ` | `string` |  The base package to root the output structure in   |

### General options:
| Option | Type | Description |
| --- | --- | --- |
| `  --emit        ` | `boolean` |  Emit compiled output, defaults to beside the input files, specify a path to override location, defaults to true |
| `  --emitJS      ` | `boolean` |  Copy the input JS file into the compiled output, specify a path to override default location, defaults to true |
| `  --emitWrapper ` | `boolean` |  Copy the JS engine wrapper into the compiled output, specify a path to override default location, defaults to true |

### Examples:
| Option | Description |
| --- | --- |
|   ../src/main src.min.js --swift |       Compile to swift, outputting beside original source files |
|   ../src/main src.js --java.emit java |  Compile to java, outputting to a java subdirectory |

General options can be applied globally or to any language or engine, e.g. swift.emit or swift.javascriptcore.emit


