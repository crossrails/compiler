# Crossrails Complier
[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Gitter][gitter-image]][gitter-url]
[![Coverage Status][coverage-image]][coverage-url]

The crossrails compiler is a command line tool which translates JavaScript or TypeScript libraries and SDKs to other languages, namely Swift and Java with support for C# and PHP coming soon. 

The goal of the project is to enable the sharing of code from native JavaScript environments such as node and the browser to any platform capable of running a JavaScript virtual machine such as iOS, Android, Windows, MacOS and serverside environments. 

The public API of your library is translated to native code providing the developer integrating your library with a native coding experence. Behind the scenes the generated native code calls into a JavaScript engine, executing your original JavaScript source.

[npm-image]: https://img.shields.io/npm/v/@cycle/core.svg
[npm-url]: https://npmjs.org/package/typings
[travis-image]: https://travis-ci.org/crossrails/compiler.svg?branch=master
[travis-url]: https://travis-ci.org/crossrails/compiler
[gitter-image]: https://badges.gitter.im/crossrails/compiler.svg
[gitter-url]: https://gitter.im/crossrails/compiler?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge
[coverage-image]:https://coveralls.io/repos/github/crossrails/compiler/badge.svg?branch=master
[coverage-url]:https://coveralls.io/github/crossrails/compiler?branch=master
