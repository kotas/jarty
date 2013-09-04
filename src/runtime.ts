

interface Foreach {
    show: bool;
    total: number;
    first: bool;
    last: bool;
    index: number;
    iteration: number;
}

interface Counter {
    count: number;
    skip: number;
    upward: bool;
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
