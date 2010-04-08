
new Test.Unit.Runner({

	testDateParseReturnsDate: function () {
		this.assert(Jarty.Date.parse("") instanceof Date);
		this.assert(Jarty.Date.parse(false) instanceof Date);
	},
	testDateParseParsesString: function () {
		var d = Jarty.Date.parse("2009-02-14 08:31:30");
		this.assertEqual(1234567890000, d.getTime());
	},

	testDateFormat: function () {
		var d = new Date(2009, 8, 25, 12, 34, 56);
		this.assertEqual("2009-09-25 12:34:56", Jarty.Date.format("%Y-%m-%d %H:%M:%S", d));
	}

});
