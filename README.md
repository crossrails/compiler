# Crossrails Compiler [![Gitter][gitter-image]][gitter-url] [![Build status][travis-image]][travis-url] [![Coverage Status][coverage-image]][coverage-url]

The crossrails compiler is a command line tool which translates **JavaScript** or **TypeScript** libraries to other languages, namely **Swift** and **Java** with support for **C#** and **PHP** coming soon. 

The public API of your library is translated to native code providing the developer integrating your library with a fully native coding experience. Behind the scenes the generated native code executes your original source on a JavaScript engine.

The goal of the project is to enable seamless code sharing from native JavaScript environments such as Node.js and the browser to any platform capable of running a JavaScript virtual machine such as iOS, Android, Windows, macOS, tvOS plus serverside environments. 

Unlike similar tools such as [ReactNative](https://facebook.github.io/react-native/) and [NativeScript](https://www.nativescript.org/), it is not designed to let you build apps using only JavaScript and does not attempt to provide wrappers around native, platform specific APIs. It was designed to help multi discipline teams writing native apps to avoid duplicating non-UI code in multiple languages.

## Installing

```shell
npm install -g @xrails/compiler
```

## Basic usage

**Simply specify a JavaScript source file and the native language you want to translate to as an option**
```shell
xrails myLibrary.js --swift
```
This would output the Swift files beside the original source files, utilising the default JavaScript engine for the language (*JavaScriptCore in Swift's case*). 

**You can specify multiple languages at once and also specify separate output directories for each**
```shell
xrails myLibrary.js --swift.emit=src/swift --java.emit=src/java
``` 

## Under the hood

The input JavaScript source file will be bundled with the native language output and should be the same file you would include in the browser, aka post any transpilation or module bundling as it will need to be capable of running on your chosen JavaScript engine.

**To output the JavaScript source file to a specific location use the emitJS option**
```shell
xrails myLibrary.js --java.emit=src/main/java --java.emitJS=src/main/res
```

The compiler uses the source map of your input file to parse your original JavaScript or TypeScript source code, in the example above it would look for `myLibrary.js.map` in the same directory.

**If your source map is elsewhere you can specify its location**
```shell
xrails myLibrary.js --sourceMap=gen/myLibrary.js.map --java.emit=src/java
```

## Extra reading 

*  [Full  list of compiler options](https://github.com/crossrails/compiler/wiki/Compiler%20Options.md)

[package-url]: https://www.npmjs.com/package/xrails/compiler
[version-image]: https://badge.fury.io/js/xrails/compiler.svg
[downloads-image]: https://img.shields.io/npm/dm/xrails/compiler.svg
[travis-image]: https://travis-ci.org/crossrails/compiler.svg?branch=master
[travis-url]: https://travis-ci.org/crossrails/compiler
[gitter-image]: https://badges.gitter.im/crossrails/compiler.svg
[gitter-url]: https://gitter.im/crossrails/compiler?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge
[coverage-image]:https://coveralls.io/repos/github/crossrails/compiler/badge.svg?branch=master
[coverage-url]:https://coveralls.io/github/crossrails/compiler?branch=master

