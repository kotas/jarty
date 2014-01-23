/// <reference path="interfaces.ts" />
/// <reference path="../version.ts" />

module Jarty {

    export class Environment implements RuntimeEnvironment {

        foreachs:{ [index: string]: Foreach } = {};
        captures:{ [index: string]: string } = {};
        counters:{ [index: string]: Counter } = {};

        constructor(private runtime:RuntimeContext) {
        }

        getNow(): number {
            return (new Date()).getTime();
        }

        getConst(): void {
            this.runtime.raiseError("not implemented: $jarty.const");
        }

        getVersion(): string {
            return version;
        }

        getLdelim(): string {
            return "{";
        }

        getRdelim(): string {
            return "}";
        }

        getForeach(name: string, key: string): any {
            if (!name) {
                this.runtime.raiseError("`$jarty.foreach` must be followed by foreach name");
            }
            if (!key) {
                this.runtime.raiseError("`$jarty.foreach." + name + "` must be followed by property name");
            }
            if (!this.foreachs.hasOwnProperty(name)) {
                this.runtime.raiseError("`$jarty.foreach." + name + "` does not exist");
            }
            if (!this.foreachs[name].hasOwnProperty(key)) {
                this.runtime.raiseError("`$jarty.foreach." + name + "." + key + "` does not exist");
            }
            return this.foreachs[name][key];
        }

        getCapture(name: string): string {
            if (!name) {
                this.runtime.raiseError("`$jarty.capture` must be followed by capture name");
            }
            if (!this.captures.hasOwnProperty(name)) {
                this.runtime.raiseError("`$jarty.capture." + name + "` does not exist");
            }
            return this.captures[name];
        }

    }

}
