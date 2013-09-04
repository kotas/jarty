/// <reference path="./runtime.ts" />
/// <reference path="./../utils.ts" />

export module Functions {

    export interface Parameters {
        [index: string]: string;
    }

    export function ldelim(runtime: Runtime): void {
        runtime.write("{");
    }

    export function rdelim(runtime: Runtime): void {
        runtime.write("}");
    }

    export function assign(runtime: Runtime, params: Parameters): void {
        if (!params['var']) {
            runtime.raiseError("assign: `var` is not given");
        }
        runtime.dict[ params['var'] ] = params['value'];
    }

    export function capture(runtime: Runtime, params: Parameters): void {
        runtime.startCapture(params['name'] || 'default', params['assign']);
    }

    export function captureClose(runtime: Runtime): void {
        runtime.endCapture();
    }

    export function strip(runtime: Runtime): void {
        runtime.startStrip();
    }

    export function stripClose(runtime: Runtime): void {
        runtime.endStrip();
    }

    export function math(runtime: Runtime, params: Parameters): void {
        if (!params['equation'])
            runtime.raiseError("math: `equation` is not given");
        if (params['format'])
            runtime.raiseError("math: `format` is not implemented");

        var equation = Utils.stringify(params['equation']);
        var answer: string;
        try {
            answer = Utils.stringify(eval("with (params) { with (Math) { " + equation + " } }"));
        } catch (e) {
            runtime.raiseError("math: invalid equation: " + (e.message || e));
        }

        if (params['assign']) {
            runtime.dict[params['assign']] = answer;
        } else {
            runtime.write(answer);
        }
    }

    export function counter(runtime: Runtime, params: Parameters): void {
        var name: string = params['name'] || "default";
        var counter = runtime.env.counters[name];
        var init = false;

        if (!counter) {
            runtime.env.counters[name] = counter = {
                count:  1,
                skip:   1,
                upward: true
            };
            init = true;
        }

        if (params['start'] !== undefined) {
            counter.count = parseInt(params['start']) || 0;
        }
        if (params['skip'] !== undefined) {
            counter.skip = parseInt(params['skip']) || 0;
        }
        if (params['direction'] !== undefined) {
            counter.upward = (params['direction'] == "up");
        }

        if (params['start'] === undefined && !init) {
            counter.count += counter.skip * (counter.upward ? +1 : -1);
        }
        if (params['print'] || params['print'] === undefined) {
            runtime.write(counter.count.toString());
        }
        if (params['assign']) {
            runtime.dict[params['assign']] = counter.count;
        }
    }

}
