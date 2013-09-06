/// <reference path="./compiler/compiler.ts" />
/// <reference path="./runtime/runtime.ts" />

export var version = '1.0.0';

export var compiler:Compiler = null;

export function compile(source:string):Function {
    this.compiler = this.compiler || new Compiler();
    return this.compiler.compileToFunction(source);
}
