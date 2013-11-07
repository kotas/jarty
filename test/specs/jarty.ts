/// <reference path="../spec_helper.ts" />

describe('Jarty', () => {
    describe('.compile()', () => {
        it('returns a function', () => {
            expect(Jarty.compile("")).to.be.a("function");
        });
    });
});
