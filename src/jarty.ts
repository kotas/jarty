/// <reference path="compiler/compiler.ts" />

module Jarty {

    var compiler:Compiler = null;

    export function compile(source:string):CompiledFunction {
        compiler = compiler || new Compiler();
        return compiler.compile(source);
    }

    export function render(source:string, dict?:Object) {
        return compile(source)(dict);
    }

}
