/**
 * Jarty
 */
/*
 * The MIT License
 * 
 * Copyright (c) 2009-2010 kotas <kotas@kotas.jp>
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
*/

(function () {

var Jarty = window.Jarty = {
	version: '0.2.1',
	debug: false,
	compiler: null,
	__globals: null,
	eval: function (source, dict) {
		return this.compile(source)(dict);
	},
	compile: function (source) {
		this.compiler = this.compiler || (new Jarty.Compiler());
		return this.compiler.compileToFunction(source);
	},
	debugPrint: function (s) {
		console.log(s);
	},
	globals: function (dict) {
		if (!this.__globals)
			this.__globals = Jarty.Namespace.prototype = {};
		for (var key in dict)
			this.__globals[key] = dict[key];
	},
	clearGlobals: function () {
		this.__globals = Jarty.Namespace.prototype = {};
	},
	removeGlobal: function (key) {
		if (this.__globals)
			delete this.__globals[key];
	}
};

Jarty.Utils = {
	stringify: function (value) {
		if (typeof value == "string")
			return value;
		if (value === null || value === undefined)
			return "";
		else
			return String(value);
	},
	quote: function (str) {
		str = Jarty.Utils.stringify(str).replace(/[\x00-\x1f\\]/g, function (chr) {
			var special = Jarty.Utils.SpecialChar[chr];
			return special ? special : '\\u00' + Jarty.Utils.padNumber(chr.charCodeAt(0), 2, 16);
		});
		return '"' + str.replace(/"/g, '\\"') + '"';
	},
	padNumber: function (num, width, radix, filling) {
		num = num.toString(radix || 10);
		filling = filling || "0"
		while (num.length < width) num = filling + num;
		return num.toUpperCase();
	}
};

Jarty.Utils.SpecialChar = {
	'\b': '\\b',
	'\t': '\\t',
	'\n': '\\n',
	'\f': '\\f',
	'\r': '\\r',
	'\\': '\\\\'
};

Jarty.Compiler = function (rules) {
	this.rules = rules || Jarty.Rules;
}
Jarty.Compiler.prototype = {
	compileToString: function (source) {
		source = Jarty.Utils.stringify(source);
		var script = "";
		var buffer = {
			write: function () {
				for (var i = 0, l = arguments.length; i < l; i++) {
					script += arguments[i];
					if (Jarty.debug) Jarty.debugPrint("+ write: " + arguments[i]);
				}
			}
		};
		var runner = new Jarty.Compiler.RuleRunner(buffer, this.rules);
		runner.run(source);
		delete runner;
		return script;
	},
	compileToFunction: function (source) {
		var compiled, script = this.compileToString(source);
		if (!script)
			throw new SyntaxError("Jarty compile error: " + (e.message || e));
		try {
			compiled = new Function("_", script);
		} catch (e) {
			throw new SyntaxError("Jarty compile error: " + (e.message || e) + "\n" +
				(script.length > 60 ? script.substring(0, 60) + "..." : script));
		}
		return compiled;
	}
};

Jarty.Compiler.RuleRunner = function (buffer, rules) {
	this.buffer = buffer;
	this.rules = rules;
}
Jarty.Compiler.RuleRunner.prototype = {
	run: function (source) {
		if (Jarty.debug)
			Jarty.debugPrint("@@@ Jarty.RuleRunner start [" + source.substring(0, 60) + "]");

		if (!this.buffer)
			throw new TypeError("invalid buffer");
		if (!this.rules || !this.rules.start)
			throw new TypeError("invalid rule");

		this.stack = [];
		this.current = null;
		this.stay = true;
		try {
			this.transitTo("start", source);
			while (this.current)
				this.next(this.current);
		} finally {
			delete this.stack;
			delete this.current;
			delete this.stay;
		}

		if (Jarty.debug)
			Jarty.debugPrint("@@@ Jarty.RuleRunner end");
	},
	next: function (current) {
		var rule = current.rule;
		if (rule.search) {
			this.stay = true;
			var matched, source = current.source;
			while (this.stay && source.length > 0) {
				if (matched = source.match(rule.search)) {
					current.matched = matched;
					if (matched.index > 0)
						rule.skipped && rule.skipped.call(this, this.buffer, source.slice(0, matched.index));
					rule.found && rule.found.call(this, this.buffer, matched);
					current.index += matched.index + matched[0].length;
					current.source = source = source.slice(matched.index + matched[0].length);
				} else {
					current.matched = null;
					rule.notfound && rule.notfound.call(this, this.buffer, source);
					current.index += source.length;
					current.source = source = '';
				}
			}
			if (this.stay && source.length == 0) {
				this.transitBack();
			}
		} else {
			this.transitBack();
		}
	},
	delegateTo: function (ruleName, newSource) {
		this.current.rule.leave && this.current.rule.leave.call(this, this.buffer);
		this.current = this.getNewContext(ruleName, newSource);
		this.data = this.current.data;
		this.stack[this.stack.length - 1] = this.current;
		this.stay = false;
		if (Jarty.debug) this.debugPrint("delegateTo: " + ruleName);
		this.current.rule.enter && this.current.rule.enter.call(this, this.buffer);
	},
	transitTo: function (ruleName, newSource, callback) {
		if (this.current && callback) this.current.callback = callback;
		this.current = this.getNewContext(ruleName, newSource);
		this.data = this.current.data;
		this.stack.push(this.current);
		this.stay = false;
		if (Jarty.debug) this.debugPrint("transitTo: " + ruleName);
		this.current.rule.enter && this.current.rule.enter.call(this, this.buffer);
	},
	transitBack: function () {
		this.current.rule.leave && this.current.rule.leave.call(this, this.buffer);
		this.stack.pop();
		if (this.stack.length > 0) {
			this.current = this.stack[this.stack.length - 1];
			this.data = this.current.data;
			if (this.current.callback) {
				var callback = this.current.callback;
				this.current.callback = undefined;
				callback.call(this, this.buffer);
			}
		} else {
			this.current = null;
			this.data = null;
		}
		this.stay = false;
		if (Jarty.debug) this.debugPrint("transitBack");
	},
	getNewContext: function (ruleName, newSource) {
		var rule = this.rules[ruleName];
		if (!rule)
			throw new ReferenceError("rule `" + ruleName + "` is not defined.");
		newSource = newSource !== undefined ? newSource : this.current.source;
		return {
			originalSource: newSource,
			source: newSource,
			ruleName: ruleName,
			rule: rule,
			index: 0,
			data: {},
			matched: null,
			callback: undefined
		};
	},
	raiseParseError: function (message) {
		var e = new SyntaxError("Jarty parse error: " + message);
		e.jartyStack = this.stack;
		throw e;
	},
	debugPrint: function (message) {
		Jarty.debugPrint("@ Jarty " + message);
	}
};

Jarty.Runtime = function (dict) {
	this.dict = dict;
	this.buffer = "";
	this.env = new Jarty.Runtime.Environment();
}
Jarty.Runtime.prototype = {
	write: function (str) {
		if (str !== undefined && str !== null) this.buffer += str;
	},
	startCapture: function (name, assign) {
		if (!this.capturing) {
			this.capturing = [];
			this.originalWrite = this.write;
			this.write = this.writeCaptured;
		} else {
			for (var i = 0, l = this.capturing.length; i < l; i++) {
				if (this.capturing[i].name == "__strip__") {
					if (name == "__strip__")
						this.raiseRuntimeError("nested {strip} is illegal");
					else
						this.raiseRuntimeError("{capture} can't be in {strip} block");
				}
				if (this.capturing[i].name == name)
					this.raiseRuntimeError("capture name `" + name + "` has been used");
			}
		}
		this.env.captures[name] = "";
		this.capturing.push({ name: name, assign: assign });
	},
	writeCaptured: function (str) {
		if (str === undefined || str === null) return;
		for (var i = this.capturing.length - 1; i >= 0; i--) {
			this.env.captures[this.capturing[i].name] += str;
			if (this.capturing[i].name == "__strip__") break;
		}
	},
	endCapture: function () {
		if (!this.capturing)
			this.raiseRuntimeError("capture does not match");
		var capture = this.capturing.pop();
		if (capture.assign) {
			this.dict[capture.assign] = this.env.captures[capture.name];
		}
		if (this.capturing.length == 0) {
			delete this.capturing;
			this.write = this.originalWrite;
			delete this.originalWrite;
		}
	},
	finish: function () {
		return this.buffer;
	},
	getEnvVar: function (keys) {
		var key = keys.shift();
		var method = "get" + key.slice(0, 1).toUpperCase() + key.slice(1).toLowerCase();
		if (typeof this.env[method] != "function")
			this.raiseRuntimeError("`$jarty." + key + "` does not exist");
		return this.env[method].apply(this.env, keys);
	},
	foreach: function (params, yieldFunc, elseFunc) {
		if (!params || params.from === undefined)
			this.raiseRuntimeError("foreach: `from` is not given");
		if (!params.item)
			this.raiseRuntimeError("foreach: `item` is not given");
		if (!params.from)
			return;
		if (params.name)
			return this.namedForeach(params, yieldFunc, elseFunc);

		var from = params.from, length = from.length, yielded = false,
			dict = this.dict, key = params.key, item = params.item;
		if (length === undefined) {
			for (var name in from) {
				key && (dict[key] = name);
				dict[item] = from[name];
				yieldFunc(); yielded = true;
			}
		} else {
			for (var i = 0; i < length; i++) {
				key && (dict[key] = i);
				dict[item] = from[i];
				yieldFunc(); yielded = true;
			}
		}
		if (!yielded && elseFunc) {
			elseFunc();
		}
	},
	namedForeach: function (params, yieldFunc, elseFunc) {
		var from = params.from, length = from.length, isMap = false;
		var ctx = this.env.foreachs[params.name] = { };
		var dict = this.dict, key = params.key, item = params.item, yielded = false;
		if (length === undefined) {
			length = 0;
			for (var name in from) length++;
			ctx.show = true;
			ctx.total = length;
			var index = 0;
			for (var name in from) {
				ctx.first = (index == 0);
				ctx.last = (index == length - 1);
				ctx.index = index++;
				ctx.iteration = index;
				key && (dict[key] = name);
				dict[item] = from[name];
				yieldFunc(); yielded = true;
			}
		} else {
			ctx.show = true;
			ctx.total = length;
			for (var i = 0; i < length; i++) {
				ctx.first = (i == 0);
				ctx.last = (i == length - 1);
				ctx.index = i;
				ctx.iteration = i + 1;
				key && (dict[key] = i);
				dict[item] = from[i];
				yieldFunc(); yielded = true;
			}
		}
		if (!yielded && elseFunc) {
			ctx.show = false;
			ctx.total = 0;
			elseFunc();
		}
	},
	for_: function (params, yieldFunc, elseFunc) {
		if (!params || params.to === undefined)
			this.raiseRuntimeError("for: `to` is not given");
		if (params.step !== undefined && parseInt(params.step) == 0)
			this.raiseRuntimeError("for: `step` should not be zero")
		if (!params.item)
			this.raiseRuntimeError("for: `item` is not given");

		var from = parseInt(params.from) || 0,
			to = parseInt(params.to) || 0,
			step = parseInt(params.step) || 1,
			dict = this.dict,
			item = params.item,
			yielded = false;
		if (step < 0) {
			for (var i = from; i >= to; i += step) {
				dict[item] = i;
				yieldFunc(); yielded = true;
			}
		} else {
			for (var i = from; i <= to; i += step) {
				dict[item] = i;
				yieldFunc(); yielded = true;
			}
		}
		if (!yielded && elseFunc) {
			elseFunc();
		}
	},
	raiseRuntimeError: function (message) {
		throw new EvalError("Jarty runtime error: " + message);
	}
};

Jarty.Runtime.Environment = function (runtime) {
	this.runtime = runtime;
	this.foreachs = {};
	this.captures = {};
	this.counters = {};
};
Jarty.Runtime.Environment.prototype = {
	getNow: function () {
		return (new Date()).getTime();
	},
	getConst: function () {
		throw "not implemented: $jarty.const";
	},
	getVersion: function () {
		return Jarty.version;
	},
	getLdelim: function () {
		return "{";
	},
	getRdelim: function () {
		return "}";
	},
	getForeach: function (name, key) {
		if (!name)
			this.runtime.raiseRuntimeError("`$jarty.foreach` must be followed by foreach name");
		if (!key)
			this.runtime.raiseRuntimeError("`$jarty.foreach." + name + "` must be followed by property name");
		if (!(name in this.foreachs))
			this.runtime.raiseRuntimeError("`$jarty.foreach." + name + "` does not exist");
		return this.foreachs[name][key];
	},
	getCapture: function (name) {
		if (!name)
			this.runtime.raiseRuntimeError("`$jarty.capture` must be followed by capture name");
		if (!(name in this.captures))
			this.runtime.raiseRuntimeError("`$jarty.capture." + name + "` does not exist");
		return this.captures[name];
	}
};

Jarty.Function = {
	ldelim: function (r) {
		r.write("{");
	},
	rdelim: function (r) {
		r.write("}");
	},
	assign: function (r, params) {
		if (!params['var'])
			r.raiseRuntimeError("assign: `var` is not given");
		r.dict[ params['var'] ] = params['value'];
	},
	capture: function (r, params) {
		r.startCapture(params['name'] || 'default', params['assign']);
	},
	captureClose: function (r) {
		r.endCapture();
	},
	strip: function (r) {
		r.startCapture("__strip__");
	},
	stripClose: function (r) {
		r.endCapture();
		r.write(r.env.captures["__strip__"].replace(/^\s+|\s*\r?\n\s*|\s+$/g, ""));
		delete r.env.captures["__strip__"];
	},
	math: function (r, params) {
		if (!params.equation)
			r.raiseRuntimeError("math; `equation` is not given");
		if (params.format)
			r.raiseRuntimeError("math; `format` is not implemented");

		var answer, eq = Jarty.Utils.stringify(params.equation);
		try {
			answer = eval("with (params) { with (Math) { " + eq + " } }");
		} catch (e) {
			r.raiseRuntimeError("math: invalid equation: " + (e.message || e));
		}

		if (params.assign) {
			r.dict[params.assign] = answer;
		} else {
			r.write(answer);
		}
	},
	counter: function (r, params) {
		var name = params.name || "default";
		var counter = r.env.counters[name], init = false;
		if (!counter) {
			r.env.counters[name] = counter = {
				count: 1,
				skip: 1,
				upward: true
			};
			init = true;
		}
		if (params.start !== undefined)     counter.count = params.start + 0;
		if (params.skip !== undefined)      counter.skip = params.skip + 0;
		if (params.direction !== undefined) counter.upward = (params.direction == "up");
		if (params.start === undefined && !init) {
			counter.count += counter.skip * (counter.upward ? +1 : -1);
		}
		if (params.print || params.print === undefined) {
			r.write(counter.count);
		}
		if (params.assign) {
			r.dict[params.assign] = counter.count;
		}
	}
};

Jarty.Pipe = function (value) {
	this.value = value;
}
Jarty.Pipe.prototype = {
	stringify: function () {
		this.value = Jarty.Utils.stringify(this.value);
		return this;
	},
	cat: function (r, str) {
		this.value = this.stringify().value + str;
		return this;
	},
	lower: function () {
		this.value = this.stringify().value.toLowerCase();
		return this;
	},
	upper: function () {
		this.value = this.stringify().value.toUpperCase();
		return this;
	},
	countCharacters: function (r, includeWhitespace) {
		if (includeWhitespace) {
			this.value = this.stringify().value.length;
		} else {
			this.value = this.stringify().value.replace(/\s/g, "").length;
		}
		return this;
	},
	countParagraphs: function () {
		this.value = this.stringify().value.split(/[\r\n]+/).length;
		return this;
	},
	'default': function (r, defvalue) {
		if (this.value === "" || this.value === null || this.value === undefined)
			this.value = defvalue;
		return this;
	},
	escape: function (r, format) {
		this.stringify();
		format = format || "html";
		if (typeof Jarty.Utils.Escape[format] != "function")
			r.raiseRuntimeError("escape: format `" + format + "` does not exist");
		this.value = Jarty.Utils.Escape[format](this.value);
		return this;
	},
	nl2br: function () {
		this.value = this.stringify().value.replace(/\n/g, "<br />");
		return this;
	},
	regexReplace: function (r, pattern, newstr) {
		pattern = Jarty.Utils.stringify(pattern);
		var matched = pattern.match(/^(.)(.+)(\1)([a-z]*)$/);
		if (!matched)
			r.raiseRuntimeError("regex_replace: `" + pattern + "` is not regexp");
		pattern = new RegExp(matched[2], matched[4] + "g");
		this.value = this.stringify().value.replace(pattern, newstr);
		return this;
	},
	replace: function (r, pattern, newstr) {
		pattern = Jarty.Utils.stringify(pattern);
		pattern = pattern.replace(/([\\^$\(\)\-\|\[\]\+\*\?\{\}\<\>\/\.])/g, "\\$1");
		pattern = new RegExp(pattern, "g");
		this.value = this.stringify().value.replace(pattern, newstr);
		return this;
	},
	spacify: function (r, spacer) {
		this.value = this.stringify().value.replace(/(?!^|$)/g, spacer);
		return this;
	},
	strip: function (r, replacer) {
		replacer = replacer === undefined ? " " : replacer;
		this.value = this.stringify().value.replace(/\s+/g, replacer);
		return this;
	},
	stripTags: function (r, replaceWithSpace) {
		replaceWithSpace = replaceWithSpace === undefined ? true : replaceWithSpace;
		this.value = this.stringify().value.replace(/<[^>]*?>/g, replaceWithSpace ? ' ' : '');
		return this;
	},
	truncate: function (r, width, omit, breakWord, omitInMiddle) {
		width = width === undefined ? 80 : width;
		omit = omit === undefined ? "..." : omit;
		if (width == 0) {
			this.value = "";
			return this;
		}

		width = Math.max(width, omit.length + 1);
		if (this.stringify().value.length > width) {
			width -= omit.length;
			if (!breakWord && !omitInMiddle) {
				this.value = this.value.slice(0, width).replace(/\s+?(\S+)?$/, '') + omit;
			} else if (!omitInMiddle) {
				this.value = this.value.slice(0, width) + omit;
			} else {
				this.value = this.value.slice(0, Math.ceil(width / 2)) + omit +
					this.value.slice(-Math.floor(width / 2));
			}
		}
		return this;
	},

	toString: function () {
		return this.stringify().value;
	},
	valueOf: function () {
		return this.value;
	}
};


Jarty.Utils.Escape = {
	HTMLSpecialChars: {
		'&': '&amp;',
		'"': '&quot;',
		"'": '&#039;',
		'<': '&lt;',
		'>': '&gt;'
	},
	html: function (value) {
		return value.replace(/[&"'<>]/g, function ($0) {
			return Jarty.Utils.Escape.HTMLSpecialChars[$0];
		});
	},
	htmlall: function (value) {
		throw "not implemented: htmlall";
	},
	url: function (value) {
		return encodeURIComponent(value);
	},
	urlpathinfo: function (value) {
		return encodeURIComponent(value).replace(/%2F/g, '/');
	},
	quotes: function (value) {
		return value.replace(/((?:[^\\']|\\.)+)|(')|/g, function ($0, $1, $2) {
			return $2 ? "\\'" : $1;
		});
	},
	hex: function (value) {
		var newValue = "";
		for (var i = 0, l = value.length; i < l; i++)
			newValue += "%" + Jarty.Utils.padNumber(value.charCodeAt(i), 2, 16);
		return newValue;
	},
	hexentity: function (value) {
		var newValue = "";
		for (var i = 0, l = value.length; i < l; i++)
			newValue += "&#x" + Jarty.Utils.padNumber(value.charCodeAt(i), 4, 16) + ";";
		return newValue;
	},
	decentity: function (value) {
		var newValue = "";
		for (var i = 0, l = value.length; i < l; i++)
			newValue += "&#" + value.charCodeAt(i) + ";";
		return newValue;
	},
	JavaScriptSpecialChars: {
		'\\': '\\\\',
		"'": "\\'",
		'"': '\\"',
		"\r": "\\r",
		"\n": "\\n",
		"</": "<\\/"
	},
	javascript: function (value) {
		return value.replace(/[\\'"\r\n]|<\//g, function ($0) {
			return Jarty.Utils.Escape.JavaScriptSpecialChars[$0];
		});
	},
	mail: function (value) {
		return value.replace(/@/g, ' [AT] ').replace(/\./g, ' [DOT] ');
	},
	nonstd: function (value) {
		var newValue = "";
		for (var i = 0, l = value.length; i < l; i++)
			newValue += value.charCodeAt(i) >= 126 ? ("&#" + value.charCodeAt(i) + ";") : value.charAt(i);
		return newValue;
	}
};

Jarty.Namespace = function (dict) {
	for (var key in dict)
		this[key] = dict[key];
};

Jarty.Getter = function (ns /* , keys... */) {
	var obj = arguments[0], thisObj, lastObj, i = 1, l = arguments.length, key;
	while (obj && i < l) {
		key = arguments[i++];
		if (key instanceof Array) {
			if (obj instanceof Function) {
				thisObj = lastObj;
				lastObj = obj;
				obj = obj.apply(thisObj, key);
			} else {
				obj = null;
			}
		} else {
			if (key in obj) {
				lastObj = obj;
				obj = obj[key];
			} else {
				obj = null;
			}
		}
	}
	return obj;
};


var eDoubleQuoteString = '"[^"\\\\]*(?:\\\\.[^"\\\\]*)*"',
	eSingleQuoteString = '\'[^\'\\\\]*(?:\\\\.[^\'\\\\]*)*\'',
	eString = '(?:' + eDoubleQuoteString + '|' + eSingleQuoteString + ')',
	eNumber = '(?:[+-]?\\d+(?:\\.\\d+)?)',
	eFuncCall = '(?:\\([^\\)]*\\))',
	eIndexer = '(?:\\[(?:[^\\[\\]]+|\\[[^\\]]+\\])+\\])',  // 1-nest maximum.
	eVariableSuffix = '(?:(?:\\.|->)\\w+|(?:\\.|->)\\$\\w+' + eIndexer + '*|' + eIndexer + '|' + eFuncCall + ')',
	eVariable = '(?:\\$(\\w+)(' + eVariableSuffix + '*))',
	eScalar = '(?:' + eVariable + '|(' + eString + ')|(' + eNumber + ')|(\\w+))',
		/* $1 = varname, $2 = varsuffix, $3 = string, $4 = number, $5 = bareword */
	ePipe = '(?:\\|@?\\w+(?::' + eScalar + ')*)',
	eValue = eScalar + '('+ ePipe + '*)',
		/* $1 = varname, $2 = varsuffic, $3 = string, $4 = number, $5 = bareword, $6 = pipe */
	eCommentTag = '\\{\\*(.*?)\\*\\}',
	eLiteralBlock = '\\{\\s*literal\\s*\\}(.*?)\\{\\s*/literal\\s*\\}',
	eJavaScriptBlock = '\\{\\s*javascript\\s*\\}(.*?)\\{\\s*/javascript\\s*\\}',
	eEmbedTag = '\\{\\s*(\\$\\w+.*?)\\s*\\}',
	eOpenTag = '\\{\\s*(\\w+.*?)\\s*\\}',
	eCloseTag = '\\{\\s*/(\\w+)\\s*\\}';

Jarty.Rules = {

	start: {
		enter: function (out) {
			out.write("_=_||{};",
				"if(Jarty.__globals){_=new Jarty.Namespace(_)}",
				"var g=Jarty.Getter,r=new Jarty.Runtime(_),p=Jarty.Pipe,f=Jarty.Function;");
		},
		leave: function (out) {
			out.write("return r.finish();");
		},
		search: new RegExp(
				eCommentTag + '|' + eLiteralBlock + '|' + eJavaScriptBlock + '|' +
				eEmbedTag + '|' + eOpenTag + '|' + eCloseTag
		),
		skipped: function (out, skipped) {
			out.write("r.write(", Jarty.Utils.quote(skipped), ");");
		},
		found: function (out, matched) {
			if (matched[1]) { // comment
				/* skip */
			} else if (matched[2]) { // literal
				out.write("r.write(", Jarty.Utils.quote(matched[2]), ");");
			} else if (matched[3]) { // javascript
				out.write(matched[3]);
			} else if (matched[4]) {
				this.transitTo("inEmbedTag", matched[4]);
			} else if (matched[5]) {
				this.transitTo("inOpenTag", matched[5]);
			} else if (matched[6]) {
				this.transitTo("inCloseTag", matched[6]);
			}
		},
		notfound: function (out, extra) {
			out.write("r.write(", Jarty.Utils.quote(extra), ");");
		}
	},

	inEmbedTag: {
		enter: function (out) {
			out.write("r.write(");
			this.transitTo("inValue");
		},
		leave: function (out) {
			out.write(");");
		}
	},

	inOpenTag: {
		search: /^(\w+)(.*)$/,
		found: function (out, matched) {
			var method = matched[1].toLowerCase();
			if (Jarty.Rules.SpecialTags[method]) {
				this.delegateTo(Jarty.Rules.SpecialTags[method], matched[0]);
			} else if (Jarty.Function[method]) {
				out.write("f[", Jarty.Utils.quote(method), "]");
				if (matched[2]) {
					out.write("(r,");
					this.transitTo("inOpenTagArgs", matched[2], function (out) {
						out.write(");");
					});
				} else {
					out.write("(r, {});");
				}
			} else {
				this.raiseParseError("unknown tag: {" + method + "}");
			}
		},
		notfound: function (out, extra) {
			this.raiseParseError("invalid open tag");
		}
	},
	inOpenTagArgs: {
		enter: function (out) {
			out.write("{");
			this.data.first = true;
		},
		leave: function (out) {
			out.write("}");
		},
		search: new RegExp('^\\s+(\\w+)=(' + eValue + ')'),
		found: function (out, matched) {
			if (this.data.first) {
				this.data.first = false;
			} else {
				out.write(",");
			}
			out.write(Jarty.Utils.quote(matched[1]), ":");
			this.transitTo("inValue", matched[2]);
		},
		notfound: function (out, extra) {
			this.raiseParseError("invalid open tag argument");
		}
	},

	inCloseTag: {
		search: /^(\w+)$/,
		found: function (out, matched) {
			var method = matched[1].toLowerCase();
			if (Jarty.Rules.SpecialTags["/" + method]) {
				this.delegateTo(Jarty.Rules.SpecialTags["/" + method], matched[0]);
			} else {
				out.write("f[", Jarty.Utils.quote(method + "Close"), "](r);");
			}
		},
		notfound: function (out, extra) {
			this.raiseParseError("invalid close tag");
		}
	},

	inValue: {
		search: new RegExp(eValue),
		found: function (out, matched) {
			var closePipe;
			if (matched[6]) { // has pipe
				out.write("(new p(");
				closePipe = function (out) {
					out.write("))");
					this.transitTo("inPipe", matched[6], function (out) {
						out.write(".valueOf()");
					});
				}
			}
			if (matched[1]) { // variable
				if (matched[1] == "smarty" || matched[1] == "jarty") {
					if (!matched[2])
						this.raiseParseError("$" + matched[1] + " must be followed by a property name");
					this.transitTo("inEnvVar", matched[2], closePipe);
					closePipe = undefined;
				} else {
					out.write("g(_,", Jarty.Utils.quote(matched[1]));
					if (matched[2]) { // suffix
						var oldClosePipe = closePipe;
						this.transitTo("inVariableSuffix", matched[2], function (out) {
							out.write(")");
							if (oldClosePipe) oldClosePipe.call(this, out);
						});
						closePipe = undefined;
					} else {
						out.write(")");
					}
				}
			} else if (matched[3]) { // string
				if (matched[3].length <= 2)
					out.write('""');
				else {
					this.transitTo("inString", matched[3].slice(1, -1), closePipe);
					closePipe = undefined;
				}
			} else if (matched[4]) { // number
				out.write(matched[4]);
			} else if (matched[5]) { // bareword
				if (Jarty.Rules.SpecialBarewords[matched[5]]) {
					out.write(Jarty.Rules.SpecialBarewords[matched[5]]);
				} else {
					out.write(Jarty.Utils.quote(matched[5]));
				}
			}
			if (closePipe) {
				closePipe.call(this, out);
			}
		},
		notfound: function (out, extra) {
			this.raiseParseError("invalid value");
		}
	},
	inEnvVar: {
		search: new RegExp('^(?:(?:\\.|->)(\\w+)|(?:\\.|->)\\$(\\w+)(' + eIndexer + '*))'),
		enter: function (out) {
			out.write("r.getEnvVar([");
			this.data.first = true;
		},
		leave: function (out) {
			out.write("])");
		},
		found: function (out, matched) {
			if (this.data.first) {
				this.data.first = false;
			} else {
				out.write(",");
			}
			if (matched[1]) {
				out.write(Jarty.Utils.quote(matched[1]));
			} else if (matched[2]) {
				out.write("g(_,", Jarty.Utils.quote(matched[2]));
				if (matched[3]) {
					this.transitTo("inIndexer", matched[3], function (out) { out.write(")") });
				} else {
					out.write(")");
				}
			}
		},
		notfound: function (out, extra) {
			this.raiseParseError("invalid envvar suffix");
		}
	},
	inVariableSuffix: {
		search: new RegExp('^(?:(?:\\.|->)(\\w+)|(?:\\.|->)\\$(\\w+)(' + eIndexer + '*)|(' + eIndexer + ')|(' + eFuncCall + '))'),
		found: function (out, matched) {
			if (matched[1]) {
				out.write(",", Jarty.Utils.quote(matched[1]));
			} else if (matched[2]) {
				out.write(",g(_,", Jarty.Utils.quote(matched[2]));
				if (matched[3]) {
					this.transitTo("inIndexer", matched[3], function (out) { out.write(")") });
				} else {
					out.write(")");
				}
			} else if (matched[4]) {
				this.transitTo("inIndexer", matched[4]);
			} else {
				this.transitTo("inFuncCall", matched[5]);
			}
		},
		notfound: function (out, extra) {
			this.raiseParseError("invalid value indexer");
		}
	},
	inIndexer: {
		search: /^\[\s*((?:[^\[\]]|\[[^\]]+\])+)\s*\]/,
		found: function (out, matched) {
			out.write(",");
			this.transitTo("inValue", matched[1]);
		},
		notfound: function (out, extra) {
			this.raiseParseError("invalid indexer");
		}
	},
	inFuncCall: {
		search: /^\(\s*([^\)]*)\s*\)/,
		found: function (out, matched) {
			out.write(",[");
			this.transitTo("inFuncCallArgs", matched[1], function (out) {
				out.write("]");
			});
		},
		notfound: function (out, extra) {
			this.raiseParseError("invalid function call");
		}
	},
	inFuncCallArgs: {
		search: new RegExp('^(\\,?)\\s*(' + eValue + ')'),
		found: function (out, matched) {
			if (matched[1]) out.write(",");
			this.transitTo("inValue", matched[2]);
		},
		notfound: function (out, extra) {
			this.raiseParseError("invalid function arguments");
		}
	},
	inString: {
		enter: function (out) {
			this.data.first = true;
		},
		search: new RegExp('^((?:[^\\\\`]+|\\\\u[0-9a-fA-F]{4}|\\\\x[0-9a-fA-F]{2}|\\\\.)+)|^`(' + eValue + ')`'),
		found: function (out, matched) {
			if (this.data.first)
				this.data.first = false;
			else
				out.write('+');
			if (matched[1]) {
				out.write(Jarty.Utils.quote(matched[1]));
			} else if (matched[2]) {
				this.transitTo("inValue", matched[2]);
			}
		}
	},

	inPipe: {
		search: new RegExp('^\\|@?(\\w+)((?::' + eScalar + ')*)'),
		found: function (out, matched) {
			var method = matched[1].replace(
				/_(.)/g, function ($0, $1) { return $1.toUpperCase() });
			if (!Jarty.Pipe.prototype[method])
				this.raiseParseError("unknown pipe: " + matched[1]);
			out.write("[", Jarty.Utils.quote(method), "](r");
			if (matched[2]) {
				this.transitTo("inPipeArgs", matched[2], function (out) { out.write(")") });
			} else {
				out.write(")");
			}
		},
		notfound: function (out, extra) {
			this.raiseParseError("invalid pipe");
		}
	},
	inPipeArgs: {
		search: new RegExp('^:(' + eScalar + ')'),
		found: function (out, matched) {
			out.write(",");
			this.transitTo("inValue", matched[1]);
		},
		notfound: function (out, extra) {
			this.raiseParseError("invalid pipe argument");
		}
	},

	inIfTag: {
		search: /^if\s+(.+)$/,
		enter: function (out) {
			out.write("if (");
		},
		leave: function (out) {
			out.write(") {");
		},
		found: function (out, matched) {
			this.transitTo("inIfCondition", matched[1]);
		},
		notfound: function (out, extra) {
			this.raiseParseError("invalid if tag");
		}
	},
	inElseTag: {
		enter: function (out) {
			out.write("} else {");
		}
	},
	inElseIfTag: {
		search: /^elseif\s+(.+)$/,
		enter: function (out) {
			out.write("} else if (");
		},
		leave: function (out) {
			out.write(") {");
		},
		found: function (out, matched) {
			this.transitTo("inIfCondition", matched[1]);
		},
		notfound: function (out, extra) {
			this.raiseParseError("invalid elseif tag");
		}
	},
	inEndIfTag: {
		enter: function (out) {
			out.write("}");
		}
	},
	inIfCondition: {
		search: new RegExp("^\\s*(?:(\\(|\\)|&&|\\|\\||===?|>=|<=|!=|[!><%+/*-])|(and)|(or)|(not)|(" + eValue + "))"),
		found: function (out, matched) {
			if (matched[1]) {
				out.write(matched[1]);
			} else if (matched[2]) {
				out.write("&&");
			} else if (matched[3]) {
				out.write("||");
			} else if (matched[4]) {
				out.write("!");
			} else if (matched[5]) {
				this.transitTo("inValue", matched[5]);
			}
		},
		notfound: function (out, extra) {
			this.raiseParseError("invalid if condition");
		}
	},

	inForeachTag: {
		search: /^foreach(\s+.+)$/,
		found: function (out, matched) {
			out.write("r.foreach(");
			this.transitTo("inOpenTagArgs", matched[1], function (out) {
				out.write(", function () {");
			});
		},
		notfound: function (out, extra) {
			this.raiseParseError("invalid foreach tag");
		}
	},
	inForeachElseTag: {
		enter: function (out) {
			out.write("}, function () {");
		}
	},
	inEndForeachTag: {
		enter: function (out) {
			out.write("});");
		}
	},

	inForTag: {
		search: /^for(\s+.+)$/,
		found: function (out, matched) {
			out.write("r.for_(");
			this.transitTo("inOpenTagArgs", matched[1], function (out) {
				out.write(", function () {");
			});
		},
		notfound: function (out, extra) {
			this.raiseParseError("invalid for tag");
		}
	},
	inForElseTag: {
		enter: function (out) {
			out.write("}, function () {");
		}
	},
	inEndForTag: {
		enter: function (out) {
			out.write("});");
		}
	}

};

Jarty.Rules.SpecialTags = {
	"if": "inIfTag",
	"else": "inElseTag",
	"elseif": "inElseIfTag",
	"/if": "inEndIfTag",
	"foreach": "inForeachTag",
	"foreachelse": "inForeachElseTag",
	"/foreach": "inEndForeachTag",
	"for": "inForTag",
	"forelse": "inForElseTag",
	"/for": "inEndForTag"
};

Jarty.Rules.SpecialBarewords = {
	"true": "true",
	"false": "false",
	"null": "null",
	"undefined": "undefined",
	"NaN": "NaN"
};


if (typeof jQuery != "undefined") {
	var cacheKey = "jarty.evaluate.compiled";
	jQuery.fn.extend({
		jarty: function (obj, noCache) {
			if (noCache) {
				var compiled = Jarty.compile(this.val() || this.html());
			} else {
				var compiled = this.data(cacheKey);
				if (!compiled) {
					compiled = Jarty.compile(this.val() || this.html());
					this.data(cacheKey, compiled);
				}
			}
			return compiled(obj);
		}
	});
}

})();
