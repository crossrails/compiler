# Crossrails complier

The crossrails compiler is a command line tool which translates JavaScript or TypeScript libraies and SDKs to other languages, namely Swift and Java with plans to add support for C# and PHP. 

The goal of the project is to enable the sharing of code from native JavaScript enviroments such as node and the browser to any platform capable of running a JavaScript virtual machine such as iOS, Android, Windows, MacOS and serverside enviroments. 

Only the public API of your library is translated to native code so although the developer intergating your libary is provided with a native coding experence your original JavaScript source code executes on a JavaScript virtual machine behind the scenes. 

[![NPM version][npm-image]][npm-url]
[![Typings][typings-image]][typings-url]
[![Typescript][typescript-image]][typescript-url]
[![Build status][travis-image]][travis-url]
[![Gitter][gitter-image]][gitter-url]
[![Coverage Status][coverage-image]][coverage-url]

[typescript-image]: https://img.shields.io/badge/typescript-1.9.0--dev.20160516-green.svg
[typescript-url]: https://github.com/Microsoft/TypeScript
[typings-url]: https://github.com/typings/typings
[typings-image]: https://img.shields.io/badge/typings-1.0.4-green.svg
[npm-image]: https://img.shields.io/npm/v/@cycle/core.svg
[npm-url]: https://npmjs.org/package/typings
[travis-image]: https://travis-ci.org/crossrails/compiler.svg?branch=master
[travis-url]: https://travis-ci.org/crossrails/compiler
[gitter-image]: https://badges.gitter.im/crossrails/compiler.svg
[gitter-url]: https://gitter.im/crossrails/compiler?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge
[coverage-image]:https://coveralls.io/repos/github/crossrails/compiler/badge.svg?branch=master
[coverage-url]:https://coveralls.io/github/crossrails/compiler?branch=master
