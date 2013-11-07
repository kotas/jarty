/// <reference path="../spec_helper.ts" />

describe('Jarty.Compiler', () => {
    var compiler:Jarty.Compiler;

    beforeEach(() => {
        compiler = new Jarty.Compiler();
    });

    describe('#compile()', () => {
        it('returns a function', () => {
            expect(compiler.compile("")).to.be.a("function");
        });

        context('when syntax error is met', () => {

            it('throws Jarty.SyntaxError', () => {
                expect(() => {
                    compiler.compile("{$ouch...}");
                }).to.throw(Jarty.SyntaxError);
            });

            it('includes the position of syntax error', () => {
                try {
                    compiler.compile("abc\ndef\nghi{$ouch...}jkl\nmno\npqr");
                    throw "SyntaxError not thrown";
                } catch (e) {
                    expect(e).to.be.instanceof(Jarty.SyntaxError);
                    expect(e).to.have.property("position");
                    expect(e.position.col).to.equal(4);
                    expect(e.position.row).to.equal(3);
                    expect(e.position.line).to.equal("ghi{$ouch...}jkl");
                    expect(e.position.source).to.equal("abc\ndef\nghi{$ouch...}jkl\nmno\npqr");
                }
            });

        });
    });

    describe('compiled function', () => {
        it('keeps a plain text as-is', () => {
            expect(render("abc")).to.equal("abc");
        });

        it('always returns a string', () => {
            expect(render("")).to.equal("");
            expect(render(null)).to.equal("");
            expect(render(undefined)).to.equal("");
        });
    });
});
