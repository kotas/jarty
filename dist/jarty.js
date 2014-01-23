(function () {

var Jarty;
(function (Jarty) {
    function stringify(value) {
        return (value === null || value === undefined) ? "" : String(value);
    }
    Jarty.stringify = stringify;

    function zeroPad(num, width, radix) {
        if (typeof radix === "undefined") { radix = 10; }
        var s = num.toString(radix);
        while (s.length < width) {
            s = "0" + s;
        }
        return s.toUpperCase();
    }
    Jarty.zeroPad = zeroPad;

    var quoteMap = {
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '\\': '\\\\'
    };

    function quote(value) {
        var s = stringify(value).replace(/[\x00-\x1f\\]/g, function (chr) {
            return quoteMap[chr] || '\\u00' + zeroPad(chr.charCodeAt(0), 2, 16);
        });
        return '"' + s.replace(/"/g, '\\"') + '"';
    }
    Jarty.quote = quote;

    function camelize(str) {
        return str.replace(/(?:^|_)([a-z])/g, function ($0, $1) {
            return $1.toUpperCase();
        });
    }
    Jarty.camelize = camelize;
})(Jarty || (Jarty = {}));
var Jarty;
(function (Jarty) {
    var SyntaxError = (function () {
        function SyntaxError(message, position) {
            this.message = message;
            this.position = position;
            this.name = 'Jarty.SyntaxError';
        }
        SyntaxError.prototype.toString = function () {
            var str = this.message;
            if (this.position) {
                var pos = this.position;
                str += "\n{line:" + pos.row + ", col:" + pos.col + ", source:" + Jarty.quote(pos.line) + "}";
            }
            return str;
        };
        return SyntaxError;
    })();
    Jarty.SyntaxError = SyntaxError;

    var RuntimeError = (function () {
        function RuntimeError(message, runtime) {
            this.message = message;
            this.runtime = runtime;
            this.name = 'Jarty.RuntimeError';
        }
        return RuntimeError;
    })();
    Jarty.RuntimeError = RuntimeError;
})(Jarty || (Jarty = {}));
var Jarty;
(function (Jarty) {
    var GlobalNamespace = function (dict) {
        for (var key in dict) {
            if (dict.hasOwnProperty(key)) {
                this[key] = dict[key];
            }
        }
    };
    var GlobalProto = GlobalNamespace.prototype;

    (function (Global) {
        var globalUsed = false;

        function set() {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            globalUsed = true;
            if (args.length === 1) {
                var dict = args[0];
                for (var key in dict) {
                    if (dict.hasOwnProperty(key)) {
                        GlobalProto[key] = args[1];
                    }
                }
            } else {
                GlobalProto[args[0]] = args[1];
            }
        }
        Global.set = set;

        function get(key) {
            return GlobalProto[key];
        }
        Global.get = get;

        function remove(key) {
            delete GlobalProto[key];
        }
        Global.remove = remove;

        function clear() {
            globalUsed = false;
            GlobalProto = GlobalNamespace.prototype = {};
        }
        Global.clear = clear;

        function wrap(dict) {
            return globalUsed ? new GlobalNamespace(dict) : dict;
        }
        Global.wrap = wrap;
    })(Jarty.Global || (Jarty.Global = {}));
    var Global = Jarty.Global;
})(Jarty || (Jarty = {}));
var Jarty;
(function (Jarty) {
    Jarty.version = '1.0.0-alpha';
})(Jarty || (Jarty = {}));
var Jarty;
(function (Jarty) {
    var Environment = (function () {
        function Environment(runtime) {
            this.runtime = runtime;
            this.foreachs = {};
            this.captures = {};
            this.counters = {};
        }
        Environment.prototype.getNow = function () {
            return (new Date()).getTime();
        };

        Environment.prototype.getConst = function () {
            this.runtime.raiseError("not implemented: $jarty.const");
        };

        Environment.prototype.getVersion = function () {
            return Jarty.version;
        };

        Environment.prototype.getLdelim = function () {
            return "{";
        };

        Environment.prototype.getRdelim = function () {
            return "}";
        };

        Environment.prototype.getForeach = function (name, key) {
            if (!name) {
                this.runtime.raiseError("`$jarty.foreach` must be followed by foreach name");
            }
            if (!key) {
                this.runtime.raiseError("`$jarty.foreach." + name + "` must be followed by property name");
            }
            if (!this.foreachs.hasOwnProperty(key)) {
                this.runtime.raiseError("`$jarty.foreach." + name + "." + key + "` does not exist");
            }
            return this.foreachs[name][key];
        };

        Environment.prototype.getCapture = function (name) {
            if (!name) {
                this.runtime.raiseError("`$jarty.capture` must be followed by capture name");
            }
            if (!this.captures.hasOwnProperty(name)) {
                this.runtime.raiseError("`$jarty.capture." + name + "` does not exist");
            }
            return this.captures[name];
        };
        return Environment;
    })();
    Jarty.Environment = Environment;
})(Jarty || (Jarty = {}));
var Jarty;
(function (Jarty) {
    var Pipes = (function () {
        function Pipes(runtime, value) {
            this.runtime = runtime;
            this.value = value;
        }
        Pipes.register = function (name, fn) {
            this.dict[name] = fn;
        };

        Pipes.unregister = function (name) {
            delete this.dict[name];
        };

        Pipes.get = function (name) {
            return this.dict[name];
        };

        Pipes.prototype.call = function (name, args) {
            var fn = Pipes.dict[name];
            if (fn) {
                this.value = fn.apply(this, [this.runtime, this.value].concat(args));
            }
            return this;
        };

        Pipes.prototype.valueOf = function () {
            return this.value;
        };

        Pipes.prototype.toString = function () {
            return Jarty.stringify(this.value);
        };
        Pipes.dict = {};
        return Pipes;
    })();
    Jarty.Pipes = Pipes;
})(Jarty || (Jarty = {}));
var Jarty;
(function (Jarty) {
    var Functions = (function () {
        function Functions() {
        }
        Functions.register = function (name, fn) {
            this.dict[name] = fn;
        };

        Functions.unregister = function (name) {
            delete this.dict[name];
        };

        Functions.get = function (name) {
            return this.dict[name];
        };
        Functions.dict = {};
        return Functions;
    })();
    Jarty.Functions = Functions;
})(Jarty || (Jarty = {}));
var Jarty;
(function (Jarty) {
    var Runtime = (function () {
        function Runtime(dict) {
            this.buffer = "";
            this.dict = Jarty.Global.wrap(dict);
            this.env = new Jarty.Environment(this);
        }
        Runtime.prototype.write = function (str) {
            if (str !== undefined && str !== null) {
                this.buffer += str;
            }
        };

        Runtime.prototype.finish = function () {
            return this.buffer;
        };

        Runtime.prototype.raiseError = function (message) {
            throw new Jarty.RuntimeError(message, this);
        };

        Runtime.prototype.set = function (key, value) {
            this.dict[key] = value;
        };

        Runtime.prototype.get = function (key, suffixes) {
            if (!(key in this.dict)) {
                return null;
            }
            if (!suffixes || suffixes.length === 0) {
                return this.dict[key];
            }

            var value = this.dict[key];
            var lastValue = null;
            var i = 0;
            var suffix;
            var receiver;

            while (value !== null && value !== undefined && i < suffixes.length) {
                suffix = suffixes[i++];
                if (suffix instanceof Array) {
                    if (value instanceof Function) {
                        receiver = lastValue;
                        lastValue = value;
                        value = value.apply(receiver, suffix);
                    } else {
                        return null;
                    }
                } else {
                    if (suffix in value) {
                        lastValue = value;
                        value = value[suffix];
                    } else {
                        return null;
                    }
                }
            }
            return value;
        };

        Runtime.prototype.getEnvVar = function (suffixes) {
            if (suffixes.length === 0) {
                return null;
            }
            var key = suffixes[0], args = suffixes.slice(1);
            var method = "get" + Jarty.camelize(key);
            if (typeof this.env[method] !== "function") {
                this.raiseError("`$jarty." + key + "` does not exist");
            }
            return this.env[method].apply(this.env, args);
        };

        Runtime.prototype.pipe = function (value) {
            return new Jarty.Pipes(this, value);
        };

        Runtime.prototype.call = function (method, args) {
            var fn = Jarty.Functions.get(method);
            if (fn) {
                return fn(this, args);
            } else {
                return null;
            }
        };

        Runtime.prototype.foreach = function (params, yieldFunc, elseFunc) {
            var _this = this;
            if (!params.hasOwnProperty('from')) {
                this.raiseError("foreach: `from` is not given");
            }
            if (!params.hasOwnProperty('item')) {
                this.raiseError("foreach: `item` is not given");
            }
            if (!params['from']) {
                return;
            }
            if (params.hasOwnProperty('name')) {
                this.namedForeach(params, yieldFunc, elseFunc);
                return;
            }

            var yielded = false, keyVar = params['key'], itemVar = params['item'];
            this.iterate(params['from'], function (key, item) {
                keyVar && (_this.dict[keyVar] = key);
                _this.dict[itemVar] = item;
                yieldFunc();
                yielded = true;
            });

            if (!yielded && elseFunc) {
                elseFunc();
            }
        };

        Runtime.prototype.namedForeach = function (params, yieldFunc, elseFunc) {
            var _this = this;
            var from = params['from'];
            var total;
            if (typeof from['length'] === 'number') {
                total = from['length'];
            } else {
                total = 0;
                for (var key in from) {
                    if (from.hasOwnProperty(key)) {
                        total++;
                    }
                }
            }

            var ctx = this.env.foreachs[params['name']] = {
                show: false,
                total: total,
                first: false,
                last: false,
                index: 0,
                iteration: 1
            };

            var yielded = false, keyVar = params['key'], itemVar = params['item'];
            this.iterate(from, function (key, item, index) {
                ctx.show = true;
                ctx.first = (index === 0);
                ctx.last = (index === total - 1);
                ctx.index = index;
                ctx.iteration = index + 1;

                keyVar && (_this.dict[keyVar] = key);
                _this.dict[itemVar] = item;
                yieldFunc();
                yielded = true;
            });

            if (!yielded && elseFunc) {
                elseFunc();
            }
        };

        Runtime.prototype.iterate = function (target, callback) {
            if (!target) {
                return;
            }
            if (typeof target['length'] === 'number') {
                for (var i = 0, l = target['length']; i < l; i++) {
                    callback(i, target[i], i);
                }
            } else {
                var index = 0;
                for (var key in target) {
                    if (target.hasOwnProperty(key)) {
                        callback(key, target[key], index++);
                    }
                }
            }
        };

        Runtime.prototype.for_ = function (params, yieldFunc, elseFunc) {
            if (!params.hasOwnProperty('to')) {
                this.raiseError("for: `to` is not given");
            }
            if (!params.hasOwnProperty('item')) {
                this.raiseError("for: `item` is not given");
            }

            var from = parseInt(params['from']) || 0;
            var to = parseInt(params['to']) || 0;
            var step = parseInt(params['step']) || 1;

            var yielded = false, itemVar = params['item'];
            if (step < 0) {
                for (var i = from; i >= to; i += step) {
                    this.dict[itemVar] = i;
                    yieldFunc();
                    yielded = true;
                }
            } else {
                for (var i = from; i <= to; i += step) {
                    this.dict[itemVar] = i;
                    yieldFunc();
                    yielded = true;
                }
            }

            if (!yielded && elseFunc) {
                elseFunc();
            }
        };

        Runtime.prototype.startCapture = function (name, assign) {
        };

        Runtime.prototype.endCapture = function () {
        };

        Runtime.prototype.startStrip = function () {
        };

        Runtime.prototype.endStrip = function () {
        };
        return Runtime;
    })();
    Jarty.Runtime = Runtime;
})(Jarty || (Jarty = {}));
var Jarty;
(function (Jarty) {
    var Scope = (function () {
        function Scope(context, rule, source) {
            this.context = context;
            this.rule = rule;
            this.source = source;
            this.index = 0;
            this.errorIndex = 0;
            this.loopCount = 0;
            this.remainSource = source;
        }
        Scope.prototype.enter = function () {
            this.rule.enter && this.rule.enter(this.context);
        };

        Scope.prototype.leave = function () {
            this.rule.leave && this.rule.leave(this.context);
        };

        Scope.prototype.found = function (matched) {
            var skipped = this.remainSource.slice(0, matched.index);
            this.rule.found && this.rule.found(this.context, matched, skipped);

            this.errorIndex = this.index + matched.index;
            this.index += matched.index + matched[0].length;
            this.remainSource = this.remainSource.slice(matched.index + matched[0].length);
            this.loopCount++;
        };

        Scope.prototype.notfound = function () {
            this.rule.notfound && this.rule.notfound(this.context, this.remainSource);

            this.errorIndex = this.index;
            this.index += this.remainSource.length;
            this.remainSource = '';
            this.loopCount++;
        };

        Scope.prototype.resume = function () {
            if (this.resumeCallback) {
                this.resumeCallback(this.context);
                this.resumeCallback = undefined;
            }
        };

        Scope.prototype.next = function () {
            if (!this.rule.pattern || this.remainSource.length === 0) {
                return false;
            }

            var matched = this.rule.pattern.exec(this.remainSource);
            if (matched) {
                this.found(matched);
                return true;
            } else {
                this.notfound();
                return false;
            }
        };

        Scope.prototype.toErrorPosition = function () {
            var start = this.source.lastIndexOf("\n", this.errorIndex) + 1;
            var end = this.source.indexOf("\n", this.errorIndex);
            var breaks = this.source.substr(0, start).match(/\n/g);
            return {
                col: this.errorIndex - start + 1,
                row: breaks ? breaks.length + 1 : 1,
                line: this.source.substring(start, end === -1 ? this.source.length : end),
                source: this.source
            };
        };
        return Scope;
    })();

    var ScopeStack = (function () {
        function ScopeStack() {
            this.stack = [];
        }
        ScopeStack.prototype.pushScope = function (scope) {
            this.top = scope;
            this.stack.push(scope);
            this.top.enter();
        };

        ScopeStack.prototype.popScope = function () {
            if (!this.top) {
                throw new Error("Try to popScope on empty scope stack");
            }

            this.top.leave();
            this.stack.pop();

            if (this.stack.length > 0) {
                this.top = this.stack[this.stack.length - 1];
                this.top.resume();
            } else {
                this.top = null;
            }
        };

        ScopeStack.prototype.getErrorPosition = function () {
            if (this.stack.length > 0) {
                return this.stack[0].toErrorPosition();
            } else {
                return null;
            }
        };
        return ScopeStack;
    })();

    var Context = (function () {
        function Context(stack, source) {
            this.stack = stack;
            this.source = source;
            this.buffer = '';
        }
        Context.prototype.write = function () {
            var strs = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                strs[_i] = arguments[_i + 0];
            }
            for (var i = 0; i < strs.length; i++) {
                this.buffer += strs[i];
            }
        };

        Context.prototype.getTranslated = function () {
            return this.buffer;
        };

        Context.prototype.nest = function (rule, subSource, callback) {
            if (subSource === undefined) {
                subSource = this.stack.top.remainSource;
            }
            this.stack.top.resumeCallback = callback;
            this.stack.pushScope(new Scope(this, rule, subSource));
        };

        Context.prototype.getLoopCount = function () {
            return this.stack.top.loopCount;
        };

        Context.prototype.raiseError = function (message) {
            throw new Jarty.SyntaxError("Jarty parse error: " + message, this.stack.getErrorPosition());
        };
        return Context;
    })();

    var Translator = (function () {
        function Translator(rootRule) {
            this.rootRule = rootRule;
        }
        Translator.prototype.translate = function (source) {
            var stack = new ScopeStack();
            var context = new Context(stack, source);

            stack.pushScope(new Scope(context, this.rootRule, source));
            while (stack.top) {
                if (stack.top.next() === false) {
                    stack.popScope();
                }
            }
            return context.getTranslated();
        };
        return Translator;
    })();
    Jarty.Translator = Translator;
})(Jarty || (Jarty = {}));
var Jarty;
(function (Jarty) {
    (function (Rules) {
        var eDoubleQuoteString = '"[^"\\\\]*(?:\\\\.[^"\\\\]*)*"';

        var eSingleQuoteString = '\'[^\'\\\\]*(?:\\\\.[^\'\\\\]*)*\'';

        var eString = '(?:' + eDoubleQuoteString + '|' + eSingleQuoteString + ')';

        var eNumber = '(?:[+-]?\\d+(?:\\.\\d+)?)';

        var eSymbol = '[a-zA-Z_][a-zA-Z0-9_]*';

        var eFuncCall = '(?:\\([^\\)]*\\))';

        var eIndexer = '(?:\\[(?:[^\\[\\]]+|\\[[^\\]]+\\])+\\])';

        var eVariableSuffix = '(?:(?:\\.|->)' + eSymbol + '|(?:\\.|->)\\$' + eSymbol + eIndexer + '*|' + eIndexer + '|' + eFuncCall + ')';

        var eVariable = '(?:\\$(' + eSymbol + ')(' + eVariableSuffix + '*))';

        var eScalar = '(?:' + eVariable + '|(' + eString + ')|(' + eNumber + ')|(' + eSymbol + '))';

        var ePipe = '(?:\\|@?' + eSymbol + '(?::' + eScalar + ')*)';

        var eValue = eScalar + '(' + ePipe + '*)';

        var eOperators = '(?:\\(|\\)|&&|\\|\\||===?|>=|<=|!=|[!><%+/*-])';

        var eCommentTag = '\\{\\*(.*?)\\*\\}';

        var eLiteralBlock = '\\{\\s*literal\\s*\\}(.*?)\\{\\s*/literal\\s*\\}';

        var eJavaScriptBlock = '\\{\\s*javascript\\s*\\}(.*?)\\{\\s*/javascript\\s*\\}';

        var eEmbedTag = '\\{\\s*((?:\\$' + eSymbol + '|' + eString + '|' + eNumber + ').*?)\\s*\\}';

        var eOpenTag = '\\{\\s*(' + eSymbol + '.*?)\\s*\\}';

        var eCloseTag = '\\{\\s*/(' + eSymbol + ')\\s*\\}';

        Rules.start = {
            pattern: new RegExp([
                eCommentTag,
                eLiteralBlock,
                eJavaScriptBlock,
                eEmbedTag,
                eOpenTag,
                eCloseTag
            ].join("|")),
            found: function (ctx, matched, skipped) {
                if (skipped.length > 0) {
                    ctx.write("r.write(", Jarty.quote(skipped), ");");
                }

                if (matched[1]) {
                } else if (matched[2]) {
                    ctx.write("r.write(", Jarty.quote(matched[2]), ");");
                } else if (matched[3]) {
                    ctx.write(matched[3]);
                } else if (matched[4]) {
                    ctx.nest(Rules.inEmbedTag, matched[4]);
                } else if (matched[5]) {
                    ctx.nest(Rules.inOpenTag, matched[5]);
                } else if (matched[6]) {
                    ctx.nest(Rules.inCloseTag, matched[6]);
                }
            },
            notfound: function (ctx, extra) {
                ctx.write("r.write(", Jarty.quote(extra), ");");
            }
        };

        Rules.inEmbedTag = {
            enter: function (ctx) {
                ctx.write("r.write(");
                ctx.nest(Rules.inValue);
            },
            leave: function (ctx) {
                ctx.write(");");
            }
        };

        Rules.inOpenTag = {
            pattern: new RegExp('^(' + eSymbol + ')(.*)$'),
            found: function (ctx, matched) {
                var method = matched[1].toLowerCase();
                if (Rules.SpecialTags[method]) {
                    ctx.nest(Rules.SpecialTags[method], matched[0]);
                } else {
                    ctx.write("r.call(", Jarty.quote(method), ",");
                    if (matched[2]) {
                        ctx.nest(Rules.inOpenTagArgs, matched[2], function (ctx) {
                            ctx.write(");");
                        });
                    } else {
                        ctx.write("{});");
                    }
                }
            },
            notfound: function (ctx) {
                ctx.raiseError("invalid open tag");
            }
        };

        Rules.inOpenTagArgs = {
            enter: function (ctx) {
                ctx.write("{");
            },
            leave: function (ctx) {
                ctx.write("}");
            },
            pattern: new RegExp('^\\s+(' + eSymbol + ')=(' + eValue + ')'),
            found: function (ctx, matched) {
                if (ctx.getLoopCount() > 0) {
                    ctx.write(",");
                }
                ctx.write(matched[1], ":");
                ctx.nest(Rules.inValue, matched[2]);
            },
            notfound: function (ctx) {
                ctx.raiseError("invalid open tag argument");
            }
        };

        Rules.inCloseTag = {
            pattern: new RegExp('^(' + eSymbol + ')$'),
            found: function (ctx, matched) {
                var method = matched[1].toLowerCase();
                if (Rules.SpecialTags["/" + method]) {
                    ctx.nest(Rules.SpecialTags["/" + method], matched[0]);
                } else {
                    ctx.write("r.call(", Jarty.quote(method + "Close"), ");");
                }
            },
            notfound: function (ctx) {
                ctx.raiseError("invalid close tag");
            }
        };

        Rules.inValue = {
            pattern: new RegExp(eValue),
            found: function (ctx, matched) {
                var _this = this;
                var closePipe;

                if (matched[6]) {
                    ctx.write("r.pipe(");
                    closePipe = function (ctx) {
                        ctx.write(")");
                        ctx.nest(Rules.inPipe, matched[6], function (ctx) {
                            ctx.write(".valueOf()");
                        });
                    };
                }

                if (matched[1]) {
                    if (matched[2]) {
                        if (matched[1] === "smarty" || matched[1] === "jarty") {
                            ctx.write("r.getEnvVar(");
                        } else {
                            ctx.write("r.get(", Jarty.quote(matched[1]), ",");
                        }
                        var oldClosePipe = closePipe;
                        ctx.nest(Rules.inVariableSuffix, matched[2], function (ctx) {
                            ctx.write(")");
                            oldClosePipe && oldClosePipe.call(_this, ctx);
                        });
                        closePipe = undefined;
                    } else {
                        ctx.write("r.dict[", Jarty.quote(matched[1]), "]");
                    }
                } else if (matched[3]) {
                    if (matched[3].length <= 2) {
                        ctx.write('""');
                    } else {
                        ctx.nest(Rules.inString, matched[3].slice(1, -1), closePipe);
                        closePipe = undefined;
                    }
                } else if (matched[4]) {
                    ctx.write(matched[4]);
                } else if (matched[5]) {
                    if (Rules.SpecialBarewords[matched[5]]) {
                        ctx.write(Rules.SpecialBarewords[matched[5]]);
                    } else {
                        ctx.write(Jarty.quote(matched[5]));
                    }
                }

                if (closePipe) {
                    closePipe.call(this, ctx);
                }
            },
            notfound: function (ctx) {
                ctx.raiseError("invalid value");
            }
        };

        Rules.inVariableSuffix = {
            enter: function (ctx) {
                ctx.write("[");
            },
            leave: function (ctx) {
                ctx.write("]");
            },
            pattern: new RegExp('^(?:' + [
                '(?:\\.|->)(' + eSymbol + ')',
                '(?:\\.|->)\\$(' + eSymbol + ')(' + eIndexer + '*)',
                '(' + eIndexer + ')',
                '(' + eFuncCall + ')'
            ].join('|') + ')'),
            found: function (ctx, matched) {
                if (ctx.getLoopCount() > 0) {
                    ctx.write(",");
                }
                if (matched[1]) {
                    ctx.write(Jarty.quote(matched[1]));
                } else if (matched[2]) {
                    if (matched[3]) {
                        ctx.write("r.get(", Jarty.quote(matched[2]), ",");
                        ctx.nest(Rules.inVariableSuffix, matched[3], function (ctx) {
                            ctx.write(")");
                        });
                    } else {
                        ctx.write("r.dict[", Jarty.quote(matched[2]), "]");
                    }
                } else if (matched[4]) {
                    ctx.nest(Rules.inIndexer, matched[4]);
                } else {
                    ctx.nest(Rules.inFuncCall, matched[5]);
                }
            },
            notfound: function (ctx) {
                ctx.raiseError("invalid value indexer");
            }
        };

        Rules.inIndexer = {
            pattern: /^\[\s*((?:[^\[\]]|\[[^\]]+\])+)\s*\]/,
            found: function (ctx, matched) {
                ctx.nest(Rules.inValue, matched[1]);
            },
            notfound: function (ctx) {
                ctx.raiseError("invalid indexer");
            }
        };

        Rules.inFuncCall = {
            pattern: /^\(\s*([^\)]*)\s*\)/,
            found: function (ctx, matched) {
                ctx.write("[");
                ctx.nest(Rules.inFuncCallArgs, matched[1], function (ctx) {
                    ctx.write("]");
                });
            },
            notfound: function (ctx) {
                ctx.raiseError("invalid function call");
            }
        };

        Rules.inFuncCallArgs = {
            pattern: new RegExp('^(\\,?)\\s*(' + eValue + ')'),
            found: function (ctx, matched) {
                if (matched[1]) {
                    ctx.write(",");
                }
                ctx.nest(Rules.inValue, matched[2]);
            },
            notfound: function (ctx) {
                ctx.raiseError("invalid function arguments");
            }
        };

        Rules.inString = {
            pattern: new RegExp('^((?:[^\\\\`]+|\\\\u[0-9a-fA-F]{4}|\\\\x[0-9a-fA-F]{2}|\\\\.)+)|^`(' + eValue + ')`'),
            found: function (ctx, matched) {
                if (ctx.getLoopCount() > 0) {
                    ctx.write("+");
                }
                if (matched[1]) {
                    ctx.write(Jarty.quote(matched[1]));
                } else if (matched[2]) {
                    ctx.nest(Rules.inValue, matched[2]);
                }
            }
        };

        Rules.inPipe = {
            pattern: new RegExp('^\\|@?(' + eSymbol + ')((?::' + eScalar + ')*)'),
            found: function (ctx, matched) {
                ctx.write(".call(", Jarty.quote(matched[1]), ", [");
                if (matched[2]) {
                    ctx.nest(Rules.inPipeArgs, matched[2], function (ctx) {
                        ctx.write("])");
                    });
                } else {
                    ctx.write("])");
                }
            },
            notfound: function (ctx) {
                ctx.raiseError("invalid pipe");
            }
        };

        Rules.inPipeArgs = {
            pattern: new RegExp('^:(' + eScalar + ')'),
            found: function (ctx, matched) {
                if (ctx.getLoopCount() > 0) {
                    ctx.write(",");
                }
                ctx.nest(Rules.inValue, matched[1]);
            },
            notfound: function (ctx) {
                ctx.raiseError("invalid pipe argument");
            }
        };

        Rules.inIfTag = {
            enter: function (ctx) {
                ctx.write("if (");
            },
            leave: function (ctx) {
                ctx.write(") {");
            },
            pattern: /^if\s+(.+)$/,
            found: function (ctx, matched) {
                ctx.nest(Rules.inIfCondition, matched[1]);
            },
            notfound: function (ctx) {
                ctx.raiseError("invalid if tag");
            }
        };

        Rules.inElseTag = {
            enter: function (ctx) {
                ctx.write("} else {");
            }
        };

        Rules.inElseIfTag = {
            enter: function (ctx) {
                ctx.write("} else if (");
            },
            leave: function (ctx) {
                ctx.write(") {");
            },
            pattern: /^elseif\s+(.+)$/,
            found: function (ctx, matched) {
                ctx.nest(Rules.inIfCondition, matched[1]);
            },
            notfound: function (ctx) {
                ctx.raiseError("invalid elseif tag");
            }
        };

        Rules.inEndIfTag = {
            enter: function (ctx) {
                ctx.write("}");
            }
        };

        Rules.inIfCondition = {
            pattern: new RegExp('^\\s*(?:(' + eOperators + ')|(and)|(or)|(not)|(' + eValue + '))'),
            found: function (ctx, matched) {
                if (matched[1]) {
                    ctx.write(matched[1]);
                } else if (matched[2]) {
                    ctx.write("&&");
                } else if (matched[3]) {
                    ctx.write("||");
                } else if (matched[4]) {
                    ctx.write("!");
                } else if (matched[5]) {
                    ctx.nest(Rules.inValue, matched[5]);
                }
            },
            notfound: function (ctx) {
                ctx.raiseError("invalid if condition");
            }
        };

        Rules.inForeachTag = {
            pattern: /^foreach(\s+.+)$/,
            found: function (ctx, matched) {
                ctx.write("r.foreach(");
                ctx.nest(Rules.inOpenTagArgs, matched[1], function (ctx) {
                    ctx.write(", function () {");
                });
            },
            notfound: function (ctx) {
                ctx.raiseError("invalid foreach tag");
            }
        };

        Rules.inForeachElseTag = {
            enter: function (ctx) {
                ctx.write("}, function () {");
            }
        };

        Rules.inEndForeachTag = {
            enter: function (ctx) {
                ctx.write("});");
            }
        };

        Rules.inForTag = {
            pattern: /^for(\s+.+)$/,
            found: function (ctx, matched) {
                ctx.write("r.for_(");
                ctx.nest(Rules.inOpenTagArgs, matched[1], function (ctx) {
                    ctx.write(", function () {");
                });
            },
            notfound: function (ctx) {
                ctx.raiseError("invalid for tag");
            }
        };

        Rules.inForElseTag = {
            enter: function (ctx) {
                ctx.write("}, function () {");
            }
        };

        Rules.inEndForTag = {
            enter: function (ctx) {
                ctx.write("});");
            }
        };

        Rules.SpecialTags = {
            "if": Rules.inIfTag,
            "else": Rules.inElseTag,
            "elseif": Rules.inElseIfTag,
            "/if": Rules.inEndIfTag,
            "foreach": Rules.inForeachTag,
            "foreachelse": Rules.inForeachElseTag,
            "/foreach": Rules.inEndForeachTag,
            "for": Rules.inForTag,
            "forelse": Rules.inForElseTag,
            "/for": Rules.inEndForTag
        };

        Rules.SpecialBarewords = {
            "true": "true",
            "false": "false",
            "null": "null",
            "undefined": "undefined",
            "NaN": "NaN"
        };
    })(Jarty.Rules || (Jarty.Rules = {}));
    var Rules = Jarty.Rules;
})(Jarty || (Jarty = {}));
var Jarty;
(function (Jarty) {
    var Compiler = (function () {
        function Compiler(rule) {
            if (typeof rule === "undefined") { rule = Jarty.Rules.start; }
            this.rule = rule;
        }
        Compiler.prototype.compile = function (source) {
            var script = this.compileToString(source);
            try  {
                var compiled = new Function("r", script);
            } catch (e) {
                throw new Jarty.SyntaxError("Jarty compile error: " + (e.message || e) + "\n" + (script.length > 60 ? script.substr(0, 60) + "..." : script));
            }

            var wrapped = function (dict) {
                var runtime = new Jarty.Runtime(dict || {});
                compiled(runtime);
                return runtime.finish();
            };
            wrapped['jartySource'] = source;
            wrapped['jartyCompiled'] = script;
            return wrapped;
        };

        Compiler.prototype.compileToString = function (source) {
            source = Jarty.stringify(source);
            var translator = new Jarty.Translator(this.rule);
            return translator.translate(source);
        };
        return Compiler;
    })();
    Jarty.Compiler = Compiler;
})(Jarty || (Jarty = {}));
var Jarty;
(function (Jarty) {
    var compiler = null;

    function compile(source) {
        compiler = compiler || new Jarty.Compiler();
        return compiler.compile(source);
    }
    Jarty.compile = compile;

    function render(source, dict) {
        return compile(source)(dict);
    }
    Jarty.render = render;
})(Jarty || (Jarty = {}));
var Jarty;
(function (Jarty) {
    Jarty.Functions.register("ldelim", function (runtime) {
        runtime.write("{");
    });

    Jarty.Functions.register("rdelim", function (runtime) {
        runtime.write("}");
    });

    Jarty.Functions.register("assign", function (runtime, params) {
        if (!params['var']) {
            runtime.raiseError("assign: `var` is not given");
        }
        runtime.set(params['var'], params['value']);
    });

    Jarty.Functions.register("capture", function (runtime, params) {
        runtime.startCapture(params['name'] || 'default', params['assign']);
    });

    Jarty.Functions.register("captureClose", function (runtime) {
        runtime.endCapture();
    });

    Jarty.Functions.register("strip", function (runtime) {
        runtime.startStrip();
    });

    Jarty.Functions.register("stripClose", function (runtime) {
        runtime.endStrip();
    });

    Jarty.Functions.register("math", function (runtime, params) {
        if (!params['equation']) {
            runtime.raiseError("math: `equation` is not given");
        }
        if (params['format']) {
            runtime.raiseError("math: `format` is not implemented");
        }

        var equation = Jarty.stringify(params['equation']);
        var answer;
        try  {
            answer = Jarty.stringify(eval("with (params) { with (Math) { " + equation + " } }"));
        } catch (e) {
            runtime.raiseError("math: invalid equation: " + (e.message || e));
        }

        if (params['assign']) {
            runtime.set(params['assign'], answer);
        } else {
            runtime.write(answer);
        }
    });

    Jarty.Functions.register("counter", function (runtime, params) {
        var name = params['name'] || "default";
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
})(Jarty || (Jarty = {}));
var Jarty;
(function (Jarty) {
    Jarty.Pipes.register("default", function (runtime, value, defaultValue) {
        if (typeof defaultValue === "undefined") { defaultValue = null; }
        if (value === "" || value === null || value === undefined) {
            return defaultValue;
        } else {
            return value;
        }
    });

    Jarty.Pipes.register("cat", function (runtime, value, str) {
        if (typeof str === "undefined") { str = ""; }
        return Jarty.stringify(value) + str;
    });

    Jarty.Pipes.register("lower", function (runtime, value) {
        return Jarty.stringify(value).toLowerCase();
    });

    Jarty.Pipes.register("upper", function (runtime, value) {
        return Jarty.stringify(value).toUpperCase();
    });

    Jarty.Pipes.register("count_characters", function (runtime, value, includeWhitespace) {
        if (typeof includeWhitespace === "undefined") { includeWhitespace = false; }
        if (includeWhitespace) {
            return Jarty.stringify(value).length;
        } else {
            return Jarty.stringify(value).replace(/\s+/g, "").length;
        }
    });

    Jarty.Pipes.register("count_paragraphs", function (runtime, value) {
        return Jarty.stringify(value).split(/[\r\n]+/).length;
    });

    Jarty.Pipes.register("count_sentences", function (runtime, value) {
        return (Jarty.stringify(value).match(/[^\s]\.(?!\w)/g) || []).length;
    });

    Jarty.Pipes.register("count_words", function (runtime, value) {
        return (Jarty.stringify(value).match(/(?:^|\s)\S*[a-zA-Z0-9\x80-\xff]/g) || []).length;
    });

    Jarty.Pipes.register("nl2br", function (runtime, value) {
        return Jarty.stringify(value).replace(/\n/g, "<br />");
    });

    Jarty.Pipes.register("regex_replace", function (runtime, value, pattern, replace) {
        var matched = Jarty.stringify(pattern).match(/^(.)(.+)(\1)([a-z]*)$/);
        if (!matched) {
            runtime.raiseError("regex_replace: `" + pattern + "` is not regexp");
        }
        try  {
            var regexp = new RegExp(matched[2], matched[4] + "g");
        } catch (e) {
            runtime.raiseError("regex_replace: `" + pattern + "` is invalid regexp: " + (e.message || e));
        }
        return Jarty.stringify(value).replace(regexp, Jarty.stringify(replace));
    });

    Jarty.Pipes.register("replace", function (runtime, value, pattern, replace) {
        pattern = Jarty.stringify(pattern).replace(/([\\^$\(\)\-\|\[\]\+\*\?\{\}\<\>\/\.])/g, "\\$1");
        var regexp = new RegExp(pattern, "g");
        return Jarty.stringify(value).replace(regexp, replace);
    });

    Jarty.Pipes.register("spacify", function (runtime, value, spacer) {
        if (typeof spacer === "undefined") { spacer = " "; }
        return Jarty.stringify(value).split("").join(spacer);
    });

    Jarty.Pipes.register("strip", function (runtime, value, replacer) {
        if (typeof replacer === "undefined") { replacer = " "; }
        return Jarty.stringify(value).replace(/\s+/g, replacer);
    });

    Jarty.Pipes.register("strip_tags", function (runtime, value, replaceWithSpace) {
        if (typeof replaceWithSpace === "undefined") { replaceWithSpace = true; }
        return Jarty.stringify(value).replace(/<[^>]*?>/g, replaceWithSpace ? ' ' : '');
    });

    Jarty.Pipes.register("truncate", function (runtime, value, width, omit, breakWord, omitInMiddle) {
        if (typeof width === "undefined") { width = 80; }
        if (typeof omit === "undefined") { omit = "..."; }
        if (typeof breakWord === "undefined") { breakWord = false; }
        if (typeof omitInMiddle === "undefined") { omitInMiddle = false; }
        width = parseInt(width, 10) || 0;

        if (width === 0) {
            return "";
        }

        value = Jarty.stringify(value);
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
})(Jarty || (Jarty = {}));
var Jarty;
(function (Jarty) {
    Jarty.Pipes.register("escape", function (runtime, value, format) {
        if (typeof format === "undefined") { format = "html"; }
        if (typeof Escape[format] !== "function") {
            runtime.raiseError("escape: format `" + format + "` does not exist");
        }
        return Escape[format](Jarty.stringify(value));
    });

    var Escape;
    (function (Escape) {
        var htmlEscapeChars = {
            '&': '&amp;',
            '"': '&quot;',
            "'": '&#039;',
            '<': '&lt;',
            '>': '&gt;'
        };

        var jsEscapeChars = {
            '\\': '\\\\',
            "'": "\\'",
            '"': '\\"',
            "\r": "\\r",
            "\n": "\\n",
            "</": "<\\/"
        };

        function html(value) {
            return value.replace(/[&"'<>]/g, function ($0) {
                return htmlEscapeChars[$0];
            });
        }
        Escape.html = html;

        function htmlall(value) {
            throw "not implemented: htmlall";
        }
        Escape.htmlall = htmlall;

        function url(value) {
            return encodeURIComponent(value);
        }
        Escape.url = url;

        function urlpathinfo(value) {
            return encodeURIComponent(value).replace(/%2F/g, '/');
        }
        Escape.urlpathinfo = urlpathinfo;

        function quotes(value) {
            return value.replace(/((?:[^\\']|\\.)+)|(')/g, function ($0, $1, $2) {
                return $2 ? "\\'" : $1;
            });
        }
        Escape.quotes = quotes;

        function hex(value) {
            var newValue = encodeURIComponent(value);
            return newValue.replace(/(%[0-9A-F]{2})|(.)/g, function ($0, $1, $2) {
                return $1 ? $1 : "%" + $2.charCodeAt(0).toString(16);
            });
        }
        Escape.hex = hex;

        function hexentity(value) {
            var newValue = "";
            for (var i = 0, l = value.length; i < l; i++) {
                var code = value.charCodeAt(i);
                newValue += "&#x" + Jarty.zeroPad(code, code > 0xFF ? 4 : 2, 16) + ";";
            }
            return newValue;
        }
        Escape.hexentity = hexentity;

        function decentity(value) {
            var newValue = "";
            for (var i = 0, l = value.length; i < l; i++) {
                newValue += "&#" + value.charCodeAt(i) + ";";
            }
            return newValue;
        }
        Escape.decentity = decentity;

        function javascript(value) {
            return value.replace(/[\\'"\r\n]|<\//g, function ($0) {
                return jsEscapeChars[$0];
            });
        }
        Escape.javascript = javascript;

        function mail(value) {
            return value.replace(/@/g, ' [AT] ').replace(/\./g, ' [DOT] ');
        }
        Escape.mail = mail;
    })(Escape || (Escape = {}));
})(Jarty || (Jarty = {}));


    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Jarty;
    } else {
        this.Jarty = Jarty;
    }

})();
