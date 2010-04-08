/**
 * Jarty Date extension
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

var
JD = Jarty.Date = {},
JU = Jarty.Utils,
DayNames = JD.DayNames = [
	"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
MonthNames = JD.MonthNames = [
	"January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December"],
FormatDateTable = JD.FormatDateTable = {
	'%a': function (d) { return DayNames[d.getDay()].substring(0, 3) },
	'%A': function (d) { return DayNames[d.getDay()] },
	'%d': function (d) { return JU.padNumber(d.getDate(), 2) },
	'%e': function (d) { return JU.padNumber(d.getDate(), 2, 10, " ") },
	'%j': function (d) { throw "not implemented: %j" },
	'%u': function (d) { return d.getDay() + 1 },
	'%w': function (d) { return d.getDay() },
	'%U': function (d) { throw "not implemented: %U" },
	'%V': function (d) { throw "not implemented: %V" },
	'%W': function (d) { throw "not implemented: %W" },
	'%b': function (d) { return MonthNames[d.getMonth()].substring(0, 3) },
	'%B': function (d) { return MonthNames[d.getMonth()] },
	'%h': function (d) { return MonthNames[d.getMonth()].substring(0, 3) },
	'%m': function (d) { return JU.padNumber(d.getMonth()+1, 2) },
	'%C': function (d) { return JU.padNumber(Math.floor(d.getFullYear() / 100), 2) },
	'%g': function (d) { return JU.padNumber(d.getYear(), 2) },
	'%G': function (d) { return d.getFullYear() },
	'%y': function (d) { return JU.padNumber(d.getYear(), 2) },
	'%Y': function (d) { return d.getFullYear() },
	'%H': function (d) { return JU.padNumber(d.getHours(), 2) },
	'%I': function (d) { var h = d.getHours() % 12; return JU.padNumber(h == 0 ? 12 : h, 2) },
	'%l': function (d) { var h = d.getHours() % 12; return JU.padNumber(h == 0 ? 12 : h, 2, 10, ' ') },
	'%M': function (d) { return JU.padNumber(d.getMinutes(), 2) },
	'%p': function (d) { return d.getHours() < 12 ? 'AM' : 'PM' },
	'%P': function (d) { return d.getHours() < 12 ? 'am' : 'pm' },
	'%r': function (d) { return JD.format("%I:%M:%S %p", d) },
	'%R': function (d) { return JD.format("%H:%M", d) },
	'%S': function (d) { return JU.padNumber(d.getSeconds(), 2) },
	'%T': function (d) { return JD.format("%H:%M:%S", d) },
	'%X': function (d) { return d.toLocaleTimeString() },
	'%z': function (d) { return d.toUTCString().slice(26) },
	'%Z': function (d) { return d.toUTCString().slice(26) },
	'%c': function (d) { return d.toLocaleString() },
	'%D': function (d) { return JD.format("%m/%d/%y", d) },
	'%F': function (d) { return JD.format("%Y-%m-%d", d) },
	'%s': function (d) { return Math.floor(d.getTime() / 1000) },
	'%x': function (d) { return d.toLocaleDateString() },
	'%n': function (d) { return "\n" },
	'%t': function (d) { return "\t" },
	'%%': function (d) { return "%" }
};

JD.format = function (format, date) {
	date = date || (new Date());
	return JU.stringify(format).replace(
		/%[a-zA-Z%]/g,
		function ($0) {
			var f = FormatDateTable[$0];
			return f ? f(date) : $0;
		}
	)
};

JD.parse = function(str) {
	if (str instanceof Date) {
		return str;
	}
	str = JU.stringify(str);
	if (str == "") {
		return new Date();
	}
	var m;
	if (m = str.match(/^(\d{4})-?(\d{2})-?(\d{2}) ?(\d{2}):?(\d{2}):?(\d{2})$/)) {
		return new Date(m[1], parseInt(m[2])-1, m[3], m[4], m[5], m[6], 0);
	} else if (str.match(/^\d+$/)) {
		// 1-10 digits number assumed to be in seconds, 11- digits number in milliseconds.
		return new Date(parseInt(str) * (str.length > 10 ? 1 : 1000));
	} else if (!isNaN(m = Date.parse(str))) {
		return new Date(m);
	}
	return new Date();
};

Jarty.Pipe.prototype.dateFormat = function (r, format, defaultDate) {
	var date;
	if (this.stringify().value != "") {
		date = JD.parse(this.value);
	} else if (defaultDate) {
		date = JD.parse(defaultDate);
	} else {
		this.value = "";
		return this;
	}
	this.value = JD.format(format, date);
	return this;
};

})();
