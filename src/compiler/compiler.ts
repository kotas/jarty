/// <reference path="../utils.ts" />
/// <reference path="../runtime/runtime.ts" />
/// <reference path="rules.ts" />
/// <reference path="translator.ts" />

module Jarty {

    export interface CompiledFunction {
        (dict?: Object): string;
    }

    export class Compiler {

        constructor(public rule:TranslationRule = Rules.start) {
        }

        compile(source:string):CompiledFunction {
            var script = this.compileToString(source);
            try {
                var compiled = new Function("r", script);
            } catch (e) {
                throw new SyntaxError(
                    "Jarty compile error: " + (e.message || e) + "\n" +
                        (script.length > 60 ? script.substr(0, 60) + "..." : script)
                );
            }

            var wrapped = (dict?: Object): string => {
                var runtime: Runtime = new Runtime(dict || {});
                compiled(runtime);
                return runtime.finish();
            };
            wrapped['jartySource'] = source;
            wrapped['jartyCompiled'] = script;
            return wrapped;
        }

        private compileToString(source:string):string {
            source = stringify(source);
            var translator: Translator = new Translator(this.rule);
            return translator.translate(source);
        }

    }

}
