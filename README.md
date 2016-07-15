# Crossrails Complier [![Gitter][gitter-image]][gitter-url] [![NPM version][npm-image]][npm-url] [![Build status][travis-image]][travis-url] [![Coverage Status][coverage-image]][coverage-url]

The crossrails compiler is a command line tool which translates JavaScript or TypeScript libraries to other languages, namely Swift and Java with support for C# and PHP coming soon. 

The public API of your library is translated to native code providing the developer integrating your library with a native coding experence. Behind the scenes the generated native code calls into a JavaScript engine, executing your original JavaScript source.

The goal of the project is to enable the sharing of code from native JavaScript environments such as node and the browser to any platform capable of running a JavaScript virtual machine such as iOS, Android, Windows, MacOS plus serverside environments. 

Unlike related tools such as ReactNative and NativeScript it is not designed to let you build apps using only JavaScript and does not attempt to provide wrappers around native, platform specific APIs. It was designed with multi discipline teams in mind, to help them avoid duplicating non-UI code in multiple languages.

## Installing

```shell
npm install -g @xrails/compiler
```

## Usage

```shell
xrails [file.js] [options]  
```

## Documentation

*  [Full  list of compiler options](https://github.com/crossrails/compiler/wiki/Compiler%20Options.md)

[npm-image]: https://img.shields.io/npm/v/@cycle/core.svg
[npm-url]: https://npmjs.org/package/typings
[travis-image]: https://travis-ci.org/crossrails/compiler.svg?branch=master
[travis-url]: https://travis-ci.org/crossrails/compiler
[gitter-image]: https://badges.gitter.im/crossrails/compiler.svg
[gitter-url]: https://gitter.im/crossrails/compiler?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge
[coverage-image]:https://coveralls.io/repos/github/crossrails/compiler/badge.svg?branch=master
[coverage-url]:https://coveralls.io/github/crossrails/compiler?branch=master
