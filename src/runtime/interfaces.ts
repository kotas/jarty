export interface Dictionary {
    [index: string]: any;
}

export interface TagParameters {
    [index: string]: string;
}

export interface TagFunction {
    (runtime:RuntimeContext, params:TagParameters): void;
}

export interface PipeStream {
    [index: string]: PipeFunction;
}

export interface PipeFunction {
    (runtime:RuntimeContext, value:any): PipeStream;
}

export interface Foreach {
    show: boolean;
    total: number;
    first: boolean;
    last: boolean;
    index: number;
    iteration: number;
}

export interface Counter {
    count: number;
    skip: number;
    upward: boolean;
}

export interface RuntimeEnvironment {
    foreachs: { [index: string]: Foreach };
    captures: { [index: string]: string };
    counters: { [index: string]: Counter };
}

export interface RuntimeContext {
    env: RuntimeEnvironment;
    write(str:string): void;
    finish(): string;
    raiseError(message:string): void;
    set(key:string, value:any): void;
    get(key:string, ...suffixes:any[]): any;
    getEnvVar(...keys:string[]): any;
    pipe(value:any): PipeStream;
    call(method:string, args?:TagParameters): any;
    foreach(params:TagParameters, yieldFunc:() => void, elseFunc?:() => void): void;
    for_(params:TagParameters, yieldFunc:() => void, elseFunc?:() => void): void;
    startCapture(name:string, assign:string): void;
    endCapture(): void;
    startStrip(): void;
    endStrip(): void;
}
