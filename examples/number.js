'use strict';

const BNF = require('./../build/main');
const lq = require('loquat');

const jsonParser = BNF(`
  <number>                ::= "-" <non-negative-number> | <non-negative-number>
  <non-negative-number>   ::= <non-negative-integer> "." <digits0> | <non-negative-integer>
  <non-negative-integer>  ::= <digits> | "0"
  <digits>                ::= <digit-without-zero> <digits0> | <digit-without-zero>
  <digits0>               ::= <digit> <digits0> | <digit>
  <digit-without-zero>    ::= "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  <digit>                 ::= "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "0"
`, 'number');

const result = lq.parse(jsonParser, '', '-1230.0456');
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
