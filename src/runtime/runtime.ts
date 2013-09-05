/// <reference path="./interfaces.ts" />
/// <reference path="./global.ts" />
/// <reference path="../exceptions.ts" />

export class Environment implements RuntimeEnvironment {

    foreachs: { [index: string]: Foreach } = {};
    captures: { [index: string]: string } = {};
    counters: { [index: string]: Counter } = {};

    constructor(private runtime: RuntimeContext) { }

}

export class Runtime implements RuntimeContext {

    private buffer: string = "";
    dict: Dictionary;
    env: RuntimeEnvironment;

    constructor(dict: Dictionary) {
        this.dict = global.wrap(dict);
        this.env = new Environment(this);
    }

    write(str: string): void {
        if (str !== undefined && str !== null) {
            this.buffer += str;
        }
    }

    finish(): string {
        return this.buffer;
    }

    raiseError(message: string): void {
        throw new RuntimeError(message);
    }

    set(key: string, value: any): void {
        this.dict[key] = value;
    }

    get(key: string, ...suffixes: any[]): any {
        if (!(key in this.dict)) {
            return null;
        }
        if (suffixes.length === 0) {
            return this.dict[key];
        }

        var value: any = this.dict[key];
        var lastValue: any = null;
        var i: number = 0;
        var suffix: any;
        var receiver: any;

        while (value !== null && value !== undefined && i < suffixes.length) {
            suffix = suffixes[i++];
            if (suffix instanceof Array) { // method call (suffix is arguments)
                if (value instanceof Function) {
                    receiver = lastValue;
                    lastValue = value;
                    value = value.apply(receiver, suffix);
                } else {
                    return null;
                }
            } else { // property access (suffix is property name)
                if (suffix in value) {
                    lastValue = value;
                    value = value[suffix];
                } else {
                    return null;
                }
            }
        }
        return value;
    }

    getEnvVar(...keys: string[]): any {

    }

    pipe(value: any): PipeStream {
        return {};
    }

    call(method: string, args?: TagParameters): any {

    }

    foreach(params: TagParameters, yieldFunc: () => void, elseFunc?: () => void): void {

    }

    for_(params: TagParameters, yieldFunc: () => void, elseFunc?: () => void): void {

    }

    startCapture(name: string, assign: string): void {

    }

    endCapture(): void {

    }

    startStrip(): void {

    }

    endStrip(): void {

    }

}
