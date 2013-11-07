/// <reference path="../../utils.ts" />
/// <reference path="../functions.ts" />

module Jarty {

    Functions.register("ldelim", (runtime:RuntimeContext):void => {
        runtime.write("{");
    });

    Functions.register("rdelim", (runtime:RuntimeContext):void => {
        runtime.write("}");
    });

    Functions.register("assign", (runtime:RuntimeContext, params:Object):void => {
        if (!params['var']) {
            runtime.raiseError("assign: `var` is not given");
        }
        runtime.set(params['var'], params['value']);
    });

    Functions.register("capture", (runtime:RuntimeContext, params:Object):void => {
        runtime.startCapture(params['name'] || 'default', params['assign']);
    });

    Functions.register("captureClose", (runtime:RuntimeContext):void => {
        runtime.endCapture();
    });

    Functions.register("strip", (runtime:RuntimeContext):void => {
        runtime.startStrip();
    });

    Functions.register("stripClose", (runtime:RuntimeContext):void => {
        runtime.endStrip();
    });

    Functions.register("math", (runtime:RuntimeContext, params:Object):void => {
        if (!params['equation']) {
            runtime.raiseError("math: `equation` is not given");
        }
        if (params['format']) {
            runtime.raiseError("math: `format` is not implemented");
        }

        var equation = stringify(params['equation']);
        var answer:string;
        try {
            answer = stringify(eval("with (params) { with (Math) { " + equation + " } }"));
        } catch (e) {
            runtime.raiseError("math: invalid equation: " + (e.message || e));
        }

        if (params['assign']) {
            runtime.set(params['assign'], answer);
        } else {
            runtime.write(answer);
        }
    });

    Functions.register("counter", (runtime:RuntimeContext, params:Object):void => {
        var name:string = params['name'] || "default";
        var counter = runtime.env.counters[name];
        var init = false;

        if (!counter) {
            runtime.env.counters[name] = counter = {
                count: 1,
                skip: 1,
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
    });

}
