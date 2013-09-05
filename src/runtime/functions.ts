/// <reference path="./interfaces.ts" />
/// <reference path="./../utils.ts" />

export module Functions {

    export var ldelim: TagFunction = (runtime: RuntimeContext): void => {
        runtime.write("{");
    };

    export var rdelim: TagFunction = (runtime: RuntimeContext): void => {
        runtime.write("}");
    };

    export var assign: TagFunction = (runtime: RuntimeContext, params: TagParameters): void => {
        if (!params['var']) {
            runtime.raiseError("assign: `var` is not given");
        }
        runtime.set(params['var'], params['value']);
    };

    export var capture: TagFunction = (runtime: RuntimeContext, params: TagParameters): void => {
        runtime.startCapture(params['name'] || 'default', params['assign']);
    };

    export var captureClose: TagFunction = (runtime: RuntimeContext): void => {
        runtime.endCapture();
    };

    export var strip: TagFunction = (runtime: RuntimeContext): void => {
        runtime.startStrip();
    };

    export var stripClose: TagFunction = (runtime: RuntimeContext): void => {
        runtime.endStrip();
    };

    export var math: TagFunction = (runtime: RuntimeContext, params: TagParameters): void => {
        if (!params['equation']) {
            runtime.raiseError("math: `equation` is not given");
        }
        if (params['format']) {
            runtime.raiseError("math: `format` is not implemented");
        }

        var equation = Utils.stringify(params['equation']);
        var answer: string;
        try {
            answer = Utils.stringify(eval("with (params) { with (Math) { " + equation + " } }"));
        } catch (e) {
            runtime.raiseError("math: invalid equation: " + (e.message || e));
        }

        if (params['assign']) {
            runtime.set(params['assign'], answer);
        } else {
            runtime.write(answer);
        }
    };

    export var counter: TagFunction = (runtime: RuntimeContext, params: TagParameters): void => {
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
            counter.count = parseInt(params['start'], 10) || 0;
        }
        if (params['skip'] !== undefined) {
            counter.skip = parseInt(params['skip'], 10) || 0;
        }
        if (params['direction'] !== undefined) {
            counter.upward = (params['direction'] === "up");
        }

        if (params['start'] === undefined && !init) {
            counter.count += counter.skip * (counter.upward ? +1 : -1);
        }
        if (params['print'] || params['print'] === undefined) {
            runtime.write(counter.count.toString());
        }
        if (params['assign']) {
            runtime.set(params['assign'], counter.count);
        }
    };

}
