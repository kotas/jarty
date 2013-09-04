/// <reference path="./compiler/compiler.ts" />

export var version = '1.0.0';

export var compiler: Compiler = null;

export function compile(source: string): Function {
    this.compiler = this.compiler || new Compiler();
    return this.compiler.compileToFunction(source);
}
