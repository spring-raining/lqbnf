import * as lq from 'loquat';

const spaces = lq.spaces.label('');

function lexeme(parser: loquat.AbstractParser) {
  return parser.skip(spaces);
}

function symbol(str: string) {
  return lexeme(lq.string(str).try());
}

// <number> (not negative)
const numberRegExp = /(0|[1-9]\d*)(\.\d*)?([Ee][+\-]?\d*)?/;
const number = lexeme(lq.regexp(numberRegExp)).map(Number).label("number");

// <term> ::= <number> | "(" <expr> ")"
const lparen = symbol("(");
const rparen = symbol(")");
const term = lq.lazy(() => number.or(expr.between(lparen, rparen)));

// <expr1> ::= "+" <term> | "-" <term> | <term>
// <expr2> ::= <expr1> ** <expr2> | <expr1>
// <expr3> ::= <expr3> "*" <expr2> | <expr3> "/" <expr2> | <expr2>
// <expr>  ::= <expr> "+" <expr3> | <expr> "-" <expr3> | <expr3>
const plus  = symbol("+").return((x: any) => x);
const minus = symbol("-").return((x: any) => -x);
const pow   = symbol("**").return((x: any, y: any) => Math.pow(x, y));
const mul   = symbol("*").return((x: any, y: any) => x * y);
const div   = symbol("/").return((x: any, y: any) => x / y);
const add   = symbol("+").return((x: any, y: any) => x + y);
const sub   = symbol("-").return((x: any, y: any) => x - y);
const expr = lq.buildExpressionParser(
    [
        [
            new lq.Operator(lq.OperatorType.PREFIX, plus),
            new lq.Operator(lq.OperatorType.PREFIX, minus)
        ],
        [
            new lq.Operator(lq.OperatorType.INFIX, pow, lq.OperatorAssoc.RIGHT)
        ],
        [
            new lq.Operator(lq.OperatorType.INFIX, mul, lq.OperatorAssoc.LEFT),
            new lq.Operator(lq.OperatorType.INFIX, div, lq.OperatorAssoc.LEFT)
        ],
        [
            new lq.Operator(lq.OperatorType.INFIX, add, lq.OperatorAssoc.LEFT),
            new lq.Operator(lq.OperatorType.INFIX, sub, lq.OperatorAssoc.LEFT)
        ]
    ],
    term
);

const calc = spaces.and(expr).left(lq.eof);

console.log(lq.parse(calc, '', '1 + 2'));
