import * as lq from 'loquat';

const spaces = lq.skipMany(lq.char(' ')).label('');
function lexeme(parser: loquat.AbstractParser): loquat.AbstractParser {
  return parser.skip(spaces);
}

const lbracket = lexeme(lq.char('['));
const rbracket = lexeme(lq.char(']'));
const bar = lexeme(lq.char('|'));
const colon = lexeme(lq.char(':'));
const equal = lexeme(lq.char('='));
const semcolon = lexeme(lq.char(';'));
const colcoleq = lexeme(lq.string('::='));

const dquotedStringRegExp = /"((\\(u[0-9A-Fa-f]{4}|["\\\/bfnrt])|[^\\"\b\f\n\r\t])*?)"/;
const squotedStringRegExp = /'((\\(u[0-9A-Fa-f]{4}|['\\\/bfnrt])|[^\\'\b\f\n\r\t])*?)'/;
const escapeMap = new Map([
  ['b', '\b'],
  ['f', '\f'],
  ['n', '\n'],
  ['r', '\r'],
  ['t', '\t'],
]);
function escape(str: string) {
  return str.replace(/\\(u[0-9A-Fa-f]{4}|[^u])/g, (_, e) => {
    const type = e[0];
    if (type === 'u') {
      return String.fromCharCode(parseInt(e.substr(1), 16));
    }
    else if (escapeMap.has(type)) {
      return escapeMap.get(type);
    }
    else {
      return type;
    }
  });
}
const literal = lexeme(lq.choice([
    lq.regexp(dquotedStringRegExp, 1),
    lq.regexp(squotedStringRegExp, 1),
  ]))
  .map(escape)
  .label('literal');

const ruleNameRegexp = /<([^<>\s]+)>/;
const ruleName = lexeme(lq.regexp(ruleNameRegexp, 1))
  .label('rule-name');

const definition = lq.choice([
  literal.bind((literal: any) => lq.pure({type: 'literal', value: literal})),
  ruleName.bind((name: any) => lq.pure({type: 'rule', value: name})),
]).sepBy1(spaces);
const definitions = definition.sepBy1(bar);

const rule = ruleName.bind((name: any) =>
  colcoleq.and(definitions).bind((defs: any) =>
    lq.pure([name, defs])
  )
);
const rules = rule.sepEndBy(lexeme(lq.newline).many1())
  .map((kvs: any) => {
    const obj: any = {};
    kvs.forEach((kv: any) => {
      obj[kv[0]] = kv[1];
    });
    return obj;
  });

const bnf = spaces.and(rules).left(lq.eof);

function parse(src: string) {
  const util = require('util');
  const result = lq.parse(bnf, '', src);
  if (result.success) {
    console.log(util.inspect(
      result.value,
      { colors: true, depth: undefined }
    ));
  }
  else {
    console.error(result.error.toString());
  }
}

parse(process.argv[2]);
