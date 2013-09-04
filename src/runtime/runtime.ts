

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

export class Environment {

    foreachs: { [index: string]: Foreach } = {};
    captures: { [index: string]: string } = {};
    counters: { [index: string]: Counter } = {};

    constructor(runtime: Runtime) { }

}

export class Runtime {

    dict: Object;

    env: Environment;

    write(...strs: string[]): void {

    }

    finish(): string {
        return "foobar";
    }

    raiseError(message: string): void {

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
