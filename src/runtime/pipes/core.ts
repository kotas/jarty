/// <reference path="../../utils.ts" />
/// <reference path="../pipes.ts" />

module Jarty {

    Pipes.register("default", (runtime:RuntimeContext, value:any, defaultValue:any = null): any => {
        if (value === "" || value === null || value === undefined) {
            return defaultValue;
        } else {
            return value;
        }
    });

    Pipes.register("cat", (runtime:RuntimeContext, value:any, str:string = ""): string => {
        return stringify(value) + str;
    });

    Pipes.register("lower", (runtime:RuntimeContext, value:any): string => {
        return stringify(value).toLowerCase();
    });

    Pipes.register("upper", (runtime:RuntimeContext, value:any): string => {
        return stringify(value).toUpperCase();
    });

    Pipes.register("count_characters", (runtime:RuntimeContext, value:any, includeWhitespace:boolean = false): number => {
        if (includeWhitespace) {
            return stringify(value).length;
        } else {
            return stringify(value).replace(/\s+/g, "").length;
        }
    });

    Pipes.register("count_paragraphs", (runtime:RuntimeContext, value:any): number => {
        return stringify(value).split(/[\r\n]+/).length;
    });

    Pipes.register("count_sentences", (runtime:RuntimeContext, value:any): number => {
        return (stringify(value).match(/[^\s]\.(?!\w)/g) || []).length;
    });

    Pipes.register("count_words", (runtime:RuntimeContext, value:any): number => {
        return (stringify(value).match(/(?:^|\s)\S*[a-zA-Z0-9\x80-\xff]/g) || []).length;
    });

    Pipes.register("nl2br", (runtime:RuntimeContext, value:any): string => {
        return stringify(value).replace(/\n/g, "<br />");
    });

    Pipes.register("regex_replace", (runtime:RuntimeContext, value:any, pattern:string, replace:string): string => {
        var matched = stringify(pattern).match(/^(.)(.+)(\1)([a-z]*)$/);
        if (!matched) {
            runtime.raiseError("regex_replace: `" + pattern + "` is not regexp");
        }
        try {
            var regexp = new RegExp(matched[2], matched[4] + "g");
        } catch (e) {
            runtime.raiseError("regex_replace: `" + pattern + "` is invalid regexp: " + (e.message || e));
        }
        return stringify(value).replace(regexp, stringify(replace));
    });

    Pipes.register("replace", (runtime:RuntimeContext, value:any, pattern:string, replace:string): string => {
        pattern = stringify(pattern).replace(/([\\^$\(\)\-\|\[\]\+\*\?\{\}\<\>\/\.])/g, "\\$1");
        var regexp = new RegExp(pattern, "g");
        return stringify(value).replace(regexp, replace);
    });

    Pipes.register("spacify", (runtime:RuntimeContext, value:any, spacer:string = " "): string => {
        return stringify(value).split("").join(spacer);
    });

    Pipes.register("strip", (runtime:RuntimeContext, value:any, replacer:string = " "): string => {
        return stringify(value).replace(/\s+/g, replacer);
    });

    Pipes.register("strip_tags", (runtime:RuntimeContext, value:any, replaceWithSpace:boolean = true): string => {
        return stringify(value).replace(/<[^>]*?>/g, replaceWithSpace ? ' ' : '');
    });

    Pipes.register("truncate", (runtime:RuntimeContext, value:any, width:any = 80, omit:string = "...",
                               breakWord:boolean = false, omitInMiddle:boolean = false): string => {

        width = parseInt(width, 10) || 0;

        if (width === 0) {
            return "";
        }

        value = stringify(value);
        width = Math.max(width, omit.length + 1);
        if (value.length > width) {
            width -= omit.length;
            if (!breakWord && !omitInMiddle) {
                return value.slice(0, width).replace(/\s+?(\S+)?$/, '') + omit;
            } else if (!omitInMiddle) {
                return value.slice(0, width) + omit;
            } else {
                return value.slice(0, Math.ceil(width / 2)) + omit + value.slice(-Math.floor(width / 2));
            }
        }

        return value;
    });

}
