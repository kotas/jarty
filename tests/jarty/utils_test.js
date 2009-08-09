
new Test.Unit.Runner({

	testStringifyNullReturnsEmptyString: function () {
		this.assertEqual("", Jarty.Utils.stringify(null));
	},
	testStringifyUndefinedReturnsEmptyString: function () {
		this.assertEqual("", Jarty.Utils.stringify(undefined));
	},
	testStringifyStringReturnsSameString: function () {
		this.assertEqual("abc", Jarty.Utils.stringify("abc"));
	},
	testStringifyNumberReturnsString: function () {
		this.assertEqual("123", Jarty.Utils.stringify(123));
		this.assertEqual("123.45", Jarty.Utils.stringify(123.45));
	},
	testStringifyBooleanReturnsString: function () {
		this.assertEqual("true", Jarty.Utils.stringify(true));
		this.assertEqual("false", Jarty.Utils.stringify(false));
	},

	testQuoteReturnsQuotedString: function () {
		this.assertEqual('"abc"', Jarty.Utils.quote("abc"));
	},
	testQuoteEscapesUnsafeCharacters: function () {
		this.assertEqual('"abc\\ndef"', Jarty.Utils.quote("abc\ndef"));
		this.assertEqual('"abc\'def\'ghi"', Jarty.Utils.quote("abc'def'ghi"));
	},

	testMakeDateFromValueReturnsDate: function () {
		this.assert(Jarty.Utils.makeDateFromValue("") instanceof Date);
		this.assert(Jarty.Utils.makeDateFromValue(false) instanceof Date);
	},
	testMakeDateFromValueParsesString: function () {
		var d = Jarty.Utils.makeDateFromValue("2009-02-14 08:31:30");
		this.assertEqual(1234567890000, d.getTime());
	},

	testFormatDate: function () {
		var d = new Date(2009, 8, 25, 12, 34, 56);
		this.assertEqual("2009-09-25 12:34:56", Jarty.Utils.formatDate("%Y-%m-%d %H:%M:%S", d));
	}

});
