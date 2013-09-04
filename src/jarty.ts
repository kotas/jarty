/// <reference path="./compiler.ts" />
/// <reference path="./rules.ts" />

export var version = '1.0.0';

export var compiler: Compiler;

export function compile(source: string): Function {
    this.compiler = this.compiler || (new Compiler(Rules));
    return this.compiler.compileToFunction(source);
}
