# Jarty

## Jarty とは

- Jarty はテンプレートエンジンです。
- PHP ではポピュラーなテンプレートエンジンである Smarty ( http://www.smarty.net/ ) を
  JavaScript で実装したものです。
- 変数置換、if、foreach、変数修飾子（パイプ）などなどをサポートしています。

## 簡単な例

    テンプレート:
    Hello, {$thing}!
    
    入力辞書:
    { thing: "world" }
    
    出力:
    Hello, world!

examples ディレクトリにサンプルがあります。

## コード例

    var template = Jarty.compile("Hello, {$thing}");
    var dictionary = { thing: "world" };
    $("#output").text( template(dictionary) );

## 動作原理

Jarty.compile() にテンプレートの文字列を渡すと、
Jarty はそれをパースして一つの関数として返します。

返される関数の構造は下記のようなシンプルなものです。

    function (_) {
        var r = new Jarty.Runtime(_);
        r.write("Hello, ");
        r.write(_["thing"]);
        r.write("!");
        return r.finish();
    }

r.write() の中身はこれだけです:

    write: function (str) {
        this.buffer += str;
    },

シンプルなので速い・・・はずです。

もし何度も同じテンプレートを使い回す場合は、コンパイル済みの関数を保持しておくことでコンパイルにかかる時間を節約できます。
毎回コンパイルするのに比べると断然速いです。 tests/benchmark.html で試せます。

## jQuery ユーザーへ

Jarty を読み込むと jQuery.fn.jarty() を定義します。(jQuery オブジェクトがある場合)

もし Jarty のテンプレートが HTML 文書中に書かれているなら、下記のように使えます。

    HTML:
    <div id="source">Hello, {$thing}!</div>
    
    JavaScript:
    $("#source").jarty({ thing: "world" })  // => "Hello, world!"

この場合、 Jarty がコンパイル済み関数をHTML要素ごとに自動でキャッシュするので
特に意識する必要はありません。キャッシュしたくない場合/使いたくない場合は第二引数を true にしてください。

## 独自の関数/パイプを定義する

まだちゃんとドキュメント化していませんが、簡単なアーキテクチャです。

関数({foobar} など)とパイプはそれぞれ Jarty.Function と Jarty.Pipe のメソッドになっています。
定義されているメソッドは、コンパイル時ではなくコンパイル済み関数を実行する度に呼び出されます。

### Jarty.Function - 関数の名前空間

    {foo_bar}
        =>  Jarty.Function.fooBar(runtime) が呼び出されます。
        
    {/foo_bar}
        =>  Jarty.Function.fooBarClose(runtime) が呼び出されます。
        
    {foo bar="baz" qux=123}
        =>  Jarty.Function.foo(runtime, { "bar": "baz", "qux": 123 }) が呼び出されます。

runtime はユーティリティメソッドを持っています。

    runtime.write("string")
        =>  出力バッファに文字列を書き込みます。 (コンパイル済み関数の戻り値に含まれます)

### Jarty.Pipe - パイプの名前空間

パイプはメソッドチェーンで表現されます。

    {$foo|bar:123|baz}
        =>  (new Jarty.Pipe(_["foo"])).bar(runtime, 123).baz(runtime).valueOf()

        複雑に見えますが、そんなに難しくないです。
            (new Jarty.Pipe(_["foo"]))
                .bar(runtime, 123)
                .baz(runtime)
                .valueOf()

Jarty.Pipe.prototype にメソッドを定義すればパイプを作れます。

パイプメソッドの中では this.value で現在の値を参照/設定できます。
また、メソッドチェーンで実装されているため、必ず return this をする必要があります。
