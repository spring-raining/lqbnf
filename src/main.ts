import loquat = require('loquat');
import bnfParser from './bnf';
import {Definition} from './definition';

const lq = loquat();

function parseRules(src: string): {[k: string]: Array<Array<Definition>>} {
  const result = lq.parse(bnfParser, '', src);
  if (result.success) {
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

function getParser(startRule: string, grammer: {[k: string]: Array<Array<Definition>>}): loquat.AbstractParser {

  function choice(rule: string): loquat.AbstractParser {
    return new lq.Parser((state: loquat.State) => {
      let consumedErr: loquat.AbstractParseError | null = null;
      const errs: loquat.AbstractParseError[] = [];

      const seqs = grammer[rule].map((defs) => sequence(defs));
      for (const seq of seqs) {
        const ret = seq(state);
        if (ret.result.success) {
          return ret.result;
        }
        else {
          consumedErr = consumedErr || ret.consumedErr;
          errs.push(ret.result.err);
          continue;
        }
      }
      if (consumedErr) {
        return lq.Result.cerr(consumedErr);
      }
      else {
        const err = errs.reduceRight(
          (prev, current) => lq.ParseError.merge(current, prev),
          lq.ParseError.unknown(state.pos));
        return lq.Result.eerr(err);
      }
    });
  }

  function sequence(defs: Array<Definition>): (state: loquat.State) => {
    result: loquat.Result;
    consumedErr: loquat.AbstractParseError | null;
  } {
    return (state: loquat.State) => {
      const label = (defs.length === 1)
        ? defs[0].getLabel()
        : `[${defs.map(_ => _.getLabel()).join(', ')}]`;

      let consumedErr: loquat.AbstractParseError | null = null;

      const result = new lq.Parser((state: loquat.State) => {
        const accum: Array<any> = [];
        let currentState = state;
        let currentErr: loquat.AbstractParseError = lq.ParseError.unknown(state.pos);
        let consumed = false;

        for (const def of defs) {
          let parser: loquat.AbstractParser;
          if (def.type === 'literal') {
            parser = (def.value.length === 1)? lq.char(def.value) : lq.string(def.value);
            parser = parser.label(lq.show(def.value));
          }
          else {
            parser = lq.lazy(() => choice(def.value));
          }

          const res = parser.run(currentState);
          if (res.success) {
            if (res.consumed) {
              consumed = true;
              accum.push(res.val);
              currentState = res.state;
              currentErr = res.err;
            }
            else {
              accum.push(res.val);
              currentState = res.state;
              currentErr = lq.ParseError.merge(currentErr, res.err);
            }
          }
          else {
            if (res.consumed) {
              consumedErr = res.err;
              return lq.Result.cerr(res.err);
            }
            else {
              return consumed
                ? lq.Result.cerr(lq.ParseError.merge(currentErr, res.err))
                : lq.Result.eerr(lq.ParseError.merge(currentErr, res.err));
            }
          }
        }
        return consumed
          ? lq.Result.csuc(currentErr, accum, currentState)
          : lq.Result.esuc(currentErr, accum, currentState);
      }).label(label).run(state);
      return { result, consumedErr };
    };
  }

  return choice(startRule);
}

module.exports = function(rules: string, startRule: string): loquat.AbstractParser {
  const grammer = parseRules(rules);
  checkDefinitions(startRule, grammer);
  const parser = getParser(startRule, grammer).left(lq.eof);
  return parser;
}
