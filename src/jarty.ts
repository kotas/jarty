/// <reference path="compiler/compiler.ts" />

module Jarty {

    var compiler:Compiler = null;

    export function compile(source:string): (dict?:Object) => string {
        compiler = compiler || new Compiler();
        return compiler.compile(source);
    }

    export function render(source:string, dict?:Object) {
        return compile(source)(dict);
    }

}
