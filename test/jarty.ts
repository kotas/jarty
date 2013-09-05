/// <reference path="../definitions/mocha/mocha.d.ts" />
/// <reference path="../definitions/chai/chai.d.ts" />
/// <reference path="../compiled/jarty.d.ts" />

module spec {
    var expect = chai.expect;

    describe('Jarty', () => {
        describe('#compile()', () => {
            it('should return a function', () => {
                expect(Jarty.compile("")).to.be.a("function");
            });
        });
    });
}
