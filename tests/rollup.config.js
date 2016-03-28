import typescript from 'rollup-plugin-typescript';
import * as ts from 'typescript';

export default {
  entry: 'src.ts',
  dest: 'src.js',
  format: 'iife',  
  moduleName: 'src',
  sourceMap: true,

  plugins: [
    typescript({
        target: ts.ScriptTarget.ES5,
        typescript: require('..\\node_modules\\typescript')
    })
  ]
}