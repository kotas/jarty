/**
 * Jarty Debugger extension
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

var JD = Jarty.Debugger = {
	catchError: function (error, di) {
		di = di || {};
		if ("jartyStack" in error) {
			di.stackTrace = this.createStackTrace(error.jartyStack);
		}
		Jarty.Debugger.ErrorDialog.show(error, di);
	},

	createStackTrace: function (stack) {
		if (!stack && !stack.length) return null;

		var trace = [];
		for (var i = 0, l = stack.length; i < l; i++) {
			var c = stack[i], t = {};

			t.original = c;
			t.index = (i + 1);
			t.ruleName = c.ruleName;
			t.matched = null;
			t.source = c.originalSource || "";
			t.sourceLines = t.source.split(/\r?\n/);
			t.lineno = 1;

			if (c.matched) {
				t.matched = "[";
				for (var j = 0, m = c.matched.length; j < m; j++)
					t.matched += (j >= 1 ? ", " : "") + Jarty.Utils.quote(c.matched[j]);
				t.matched += "]";
			}

			var left = c.index;
			do {
				t.lineno++;
				left = t.source.lastIndexOf("\n", left - 1);
			} while (left > 0);

			trace.push(t);
		}

		return trace;
	}
};

Jarty.Debugger.ErrorDialog = {
	position: [10, 10, 100000],
	show: function (error, di) {
		var e = this.element = document.createElement("div");
		e.style.position = "absolute";
		e.style.left = this.position[0] + "px";
		e.style.top = this.position[1] + "px";
		e.style.zindex = (this.position[2]++);
		e.style.backgroundColor = "#FFFFFF";
		e.style.fontSize = "12px";
		e.style.color = "#000000";
		e.style.border = "2px solid #333333";
		e.style.padding = "0";
		e.style.margin = "0";

		e.innerHTML = [
			'<div style="font-size:16px; font-weight:bold; padding:5px;',
						' background-color:#C00; color:#FFF;">',
				'Jarty ', di.phase, ' error',
			'</div>',
			'<div style="padding:5px">',
				'<div style="margin-bottom:5px; font-weight:bold;">Exception</div>',
				'<div style="font-family:monospace;">',
					error,
				'</div>',
			'</div>',
			this.stackTraceToHTML(di.stackTrace),
			this.dictionaryToHTML(di.dict),
			'<div style="padding:5px">',
				'<div style="margin-bottom:5px; font-weight:bold;">Source</div>',
				'<textarea style="width:500px; height:100px; font-family:monospace;">',
					di.source,
				'</textarea>',
			'</div>',
			'<div style="padding:5px">',
				'<div style="margin-bottom:5px; font-weight:bold;">Compiled</div>',
				'<textarea style="width:500px; height:100px; font-family:monospace;">',
					di.compiled ? di.compiled.toString() : '(none)',
				'</textarea>',
			'</div>'
		].join("");

		document.body.appendChild(e);

		this.position[1] += e.clientHeight + 10;
	},
	stackTraceToHTML: function (stackTrace) {
		if (!stackTrace) return "";

		var html = '';
		html += '<div style="padding:5px">';
		html += '<div style="margin-bottom:5px; font-weight:bold;">Stacktrace</div>';
		for (var i = 0, l = stackTrace.length; i < l; i++) {
			var t = stackTrace[i];

			if (i == 1) {
				html += '<div style="margin-top:5px;">';
				html += '<a href="javascript:void(0);" style="color:#666; font-size:10px"';
				html += ' onclick="var e = this.parentNode; e.style.display = \'none\';';
				html += 	' while ((e = e.nextSibling) && /DIV/i.test(e.tagName)) { e.style.display = \'block\'; }';
				html += 	' return false;">Show all</a></div>';
			}

			html += '<div style="padding:5px; border:1px solid #CCCCCC; font-family:monospace; margin-top:5px; ' + (i > 0 ? 'display:none;' : '') + '">';
			html += 	'<div style="font-weight:bold; color:#666;">' + t.ruleName + '</div>';
			html += 	'<div style="font-size:10px; color:#AAA; margin-bottom:5px;">' + t.matched + '</div>';
			if (t.lineno > 0) {
				html += 	'<div style="width:500px; overflow:hidden">';
				html += 	'<table style="margin:0; padding:0; border:none;" cellpadding="0" cellspacing="0">';
				var lineno = Math.max(t.lineno - 4, 1),
					end = Math.min(lineno + 8, t.sourceLines.length);
				while (lineno <= end) {
					html += '<tr' + (lineno == t.lineno ? ' style="background-color:#FF6;"' : '') + '>';
					html += '<td style="padding-right: 10px; text-align:right; color:#666; border-right:1px solid #CCC;">' + lineno + '</td>';
					html += '<td width="100%" style="padding-left:5px; white-space:nowrap;">';
					html += '<pre style="margin:0; padding:0;">';
					html += (new Jarty.Pipe(t.sourceLines[lineno-1])).escape().valueOf();
					html += '</pre>';
					html += '</td>';
					html += '</tr>';
					lineno++;
				}
				html += 	'</table>';
				html +=		'</div>';
			}
			html += '</div>';
		}
		html += '</div>';
		html += '</div>';

		return html;
	},
	dictionaryToHTML: function (dict) {
		if (!dict) return "";

		var html = '';
		html += '<div style="padding:5px">';
		html += '<div style="margin-bottom:5px; font-weight:bold;">Dictionary</div>';

		html += '<div style="font-family:monospace;">';
		var first = true;
		for (var key in dict) {
			first ? (first = false) : (html += ', ');
			html += key;
		}
		html += '</div>';

		html += '<div style="margin-top:5px;">';
		html += '<a href="javascript:void(0);" style="color:#666; font-size:10px"';
		html += ' onclick="var e = this.parentNode; e.style.display = \'none\';';
		html += 	' e.previousSibling.style.display = \'none\';';
		html += 	' e.nextSibling.style.display = \'block\';';
		html += 	' return false;">Show contents</a></div>';

		html += '<div style="display:none; width:500px; overflow:hidden; font-family:monospace;">';
		html += '<table style="margin:0; padding:0; border:none;" cellpadding="0" cellspacing="0">';
		for (var key in dict) {
			html += '<tr>';
			html += '<td style="padding-right: 10px; text-align:right; color:#666; border-right:1px solid #CCC;">' + key + '</td>';
			html += '<td width="100%" style="padding-left:5px; white-space:nowrap;">';
			html += '<pre style="margin:0; padding:0;">';
			html += (new Jarty.Pipe(dict[key])).escape().valueOf();
			html += '</pre>';
			html += '</td>';
			html += '</tr>';
		}
		html += '</table>';
		html += '</div>';
		html += '</div>';
		html += '</div>';

		return html;
	}
};

var orgCompileToFunction = Jarty.Compiler.prototype.compileToFunction;
Jarty.Compiler.prototype.compileToFunction = function (source) {
	var debugInfo = {};
	debugInfo.source = source;

	debugInfo.phase = "compile";
	var compiled;
	try {
		compiled = orgCompileToFunction.apply(this, arguments);
	} catch (e) {
		debugInfo.error = e;
		JD.catchError(e, debugInfo);
		throw e;
	}

	debugInfo.phase = "runtime";
	debugInfo.compiled = compiled;
	return function (dict) {
		debugInfo.dict = dict;
		var result;
		try {
			result = compiled.apply(this, arguments);
		} catch (e) {
			debugInfo.error = e;
			JD.catchError(e, debugInfo);
			throw e;
		}
		return result;
	}
};

})();
