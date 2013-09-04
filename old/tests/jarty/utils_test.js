
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
	}

});
