/// <reference path="./compiler/compiler.ts" />
/// <reference path="./runtime/runtime.ts" />

var compiler:Compiler = null;

export function compile(source:string):Function {
    compiler = compiler || new Compiler();
    return compiler.compileToFunction(source);
}
