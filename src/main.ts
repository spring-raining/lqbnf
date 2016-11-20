import * as lq from 'loquat';
import bnfParser from './bnf';
import {Definition} from './definition';

function parseRules(src: string): {[k: string]: Array<Array<Definition>>} {
  const util = require('util');
  const result = lq.parse(bnfParser, '', src);
  if (result.success) {
    console.log(util.inspect(
      result.value,
      { colors: true, depth: undefined }
    ));
    return result.value;
  }
  else {
    throw new Error(result.error);
  }
}

function checkDefinitions(startRule: string, grammer: {[k: string]: Array<Array<Definition>>}): void {
  const rules = Object.keys(grammer);
  if (rules.indexOf(startRule) < 0) {
    throw new Error(`Start rule <${startRule}> is not defined`);
  }
  for (const r of rules) {
    const defs = grammer[r];
    for (const def of defs) {
      if (def.length === 0) {
        throw new Error(`Rule <${r}> has empty definition`);
      }
      for (const d of def) {
        if (d.type === 'rule' && rules.indexOf(d.value) < 0) {
          throw new Error(`Unknown rule: <${d.value}>`);
        }
      }
    }
  }
}

function getParser(rule: string, grammer: {[k: string]: Array<Array<Definition>>}): loquat.AbstractParser {
  return lq.choice(grammer[rule].map((defs) => {

    const label = (defs.length === 1)
      ? defs[0].getLabel()
      : `[${defs.map(_ => _.getLabel()).join(', ')}]`;

    return new lq.Parser((state: loquat.State) => {
      const accum: Array<any> = [];
      let currentState = state;
      let currentErr: loquat.AbstractParseError = lq.ParseError.unknown(state.pos);
      let consumed = false;

      for (const def of defs) {
        let parser: loquat.AbstractParser;
        if (def.type === 'literal') {
          parser = (def.value.length === 1)? lq.char(def.value) : lq.string(def.value);
          parser = lq.label(parser, lq.show(def.value));
        }
        else {
          parser = lq.lazy(() => getParser(def.value, grammer));
        }

        const res = parser.run(currentState);
        if (res.success) {
          if (res.consumed) {
            consumed = true;
          }
          accum.push(res.val);
          currentState = res.state;
          currentErr = res.err;
        }
        else {
          if (accum.length === 0) {
            // ignore first parse error
            return res.consumed
              ? lq.Result.eerr(res.err)
              : lq.Result.eerr(lq.ParseError.merge(currentErr, res.err));
          }
          else {
            if (res.consumed) {
              return lq.Result.cerr(res.err);
            }
            else {
              return consumed
                ? lq.Result.cerr(lq.ParseError.merge(currentErr, res.err))
                : lq.Result.eerr(lq.ParseError.merge(currentErr, res.err));
            }
          }
        }
      }
      return consumed
        ? lq.Result.csuc(currentErr, accum, currentState)
        : lq.Result.esuc(currentErr, accum, currentState);
    }).label(label);
  }));
}

const grammer = parseRules(process.argv[3]);
const start = 'syntax';
checkDefinitions(start, grammer);
const parser = getParser(start, grammer).left(lq.eof);
const result = lq.parse(parser, '', process.argv[2]);
if (result.success) {
  const util = require('util');
  console.log(util.inspect(
    result.value,
    { colors: true, depth: undefined }
  ));
}
else {
  console.error(result.error.toString());
}
