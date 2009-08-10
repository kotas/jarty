# Jarty

## What is Jarty?

- Jarty is a template engine.
- JavaScript implementation of Smarty ( http://www.smarty.net/ ), which
  is the popular template engine for PHP.
- Supporting variable substitution, if, foreach, modifiers (pipes), and so on.

## Example?

    Template:
    Hello, {$thing}!
    
    Input dictionary:
    { thing: "world" }
    
    And you get:
    Hello, world!

More examples on examples directory.

## Code?

    var template = Jarty.compile("Hello, {$thing}");
    var dictionary = { thing: "world" };
    $("#output").text( template(dictionary) );

## How does it work?

When you give a template string to Jarty.compile(), Jarty parses that
template string, and compiles it to a single function.

This function has a very simple structure like below.

    function (_) {
        var r = new Jarty.Runtime(_);
        r.write("Hello, ");
        r.write(_["thing"]);
        r.write("!");
        return r.finish();
    }

and r.write() will just do this:

    write: function (str) {
        this.buffer += str;
    },

You know, simpler is faster. :)

So if you use the same template several times, you want to keep the
compiled function and just call it as you want.
Very faster than compiling every time. See tests/benchmark.html

If you just want to evaluate a template once, use Jarty.eval().

    Jarty.eval("Hello, {$thing}!", { thing: "world" }) => "Hello, world!"

## For jQuery users

Jarty defines jQuery.fn.jarty() if jQuery object exists.

If you have Jarty template in the HTML document, you can use it like this:

    HTML:
    <div id="source">Hello, {$thing}!</div>
    
    JavaScript:
    $("#source").jarty({ thing: "world" })  // => "Hello, world!"

In this form, you don't have to worry about caches/compiles.
Jarty does automatically caches the compiled function for each element.
If you don't want to cache it, just pass true as the second argument.

## Define your function/pipe

Not documented yet. But very simple architecture.

Functions and pipes are methods of Jarty.Function and Jarty.Pipe respectively.
They are always proceeded when a compiled function is called, not at compile.

### Jarty.Function - is a namespace for functions.

    {foo_bar}
        =>  Jarty.Function.fooBar(runtime) is called.

    {/foo_bar}
        =>  Jarty.Function.fooBarClose(runtime) is called.

    {foo bar="baz" qux=123}
        =>  Jarty.Function.foo(runtime, { "bar": "baz", "qux": 123 }) is called.

runtime has some utility methods.

    runtime.write("string")
        =>  Writes string to the output buffer.

### Jarty.Pipe - is a namespace for pipes.

Pipes are represented as a method chain.

    {$foo|bar:123|baz}
        =>  (new Jarty.Pipe(_["foo"])).bar(runtime, 123).baz(runtime).valueOf()
    
        looks complicated?  not so hard!
            (new Jarty.Pipe(_["foo"]))
                .bar(runtime, 123)
                .baz(runtime)
                .valueOf()

So all you do is to define a method in Jarty.Pipe.prototype!

You can refer the current value by this.value in the method.
Remember that you have to return `this` for the method chain.

