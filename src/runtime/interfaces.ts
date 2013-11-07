module Jarty {

    export interface TagFunction {
        (runtime:RuntimeContext, params:Object): void;
    }

    export interface PipeStream {
        call(name:string, args:any[]):PipeStream;
        valueOf(): any;
    }

    export interface PipeFunction {
        apply(thisArg: any, argArray?: any): any;
        (runtime:RuntimeContext, value:any, ...args:any[]):any;
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
        getNow(): number;
        getConst(): void;
        getVersion(): string;
        getLdelim(): string;
        getRdelim(): string;
        getForeach(name: string, key: string): any;
        getCapture(name: string): string;
    }

    export interface RuntimeContext {
        env: RuntimeEnvironment;
        write(str:string): void;
        finish(): string;
        raiseError(message:string): void;
        set(key:string, value:any): void;
        get(key:string, suffixes?:any[]): any;
        getEnvVar(suffixes:string[]):any;
        pipe(value:any): PipeStream;
        call(method:string, args?:string[]): any;
        foreach(params:string[], yieldFunc:() => void, elseFunc?:() => void): void;
        for_(params:string[], yieldFunc:() => void, elseFunc?:() => void): void;
        startCapture(name:string, assign:string): void;
        endCapture(): void;
        startStrip(): void;
        endStrip(): void;
    }

}
