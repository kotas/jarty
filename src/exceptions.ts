export interface ErrorPosition {
    col: number;
    row: number;
    line: string;
    source: string;
}

export interface JartyError extends Error { }

export class JartySyntaxError implements JartyError {
    name: string = "JartySyntaxError";
    constructor(public message: string, public position: ErrorPosition) { }
}
