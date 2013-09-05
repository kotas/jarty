/// <reference path="./utils.ts" />

export interface ErrorPosition {
    col: number;
    row: number;
    line: string;
    source: string;
}

export interface JartyError extends Error { }

export class SyntaxError implements JartyError {
    name: string = "Jarty.SyntaxError";
    constructor(public message: string, public position?: ErrorPosition) { }

    toString(): string {
        var str: string = this.message;
        if (this.position) {
            var pos: ErrorPosition = this.position;
            str += "\n{line:" + pos.row + ", col:" + pos.col + ", source:" + Utils.quote(pos.line) + "}";
        }
        return str;
    }
}

export class RuntimeError implements JartyError {
    name: string = "Jarty.RuntimeError";
    constructor(public message: string) { }
}
