
declare namespace loquat {

  type input = any;

  /*
   * loquat-core
   */

  interface SourcePos {
    new(name: string, line: number, column: number): SourcePos;
  }

  type errorMessageType = 'systemUnexpect' | 'unexpect' | 'expect' | 'message';
  interface ErrorMessageType {
    SYSTEM_UNEXPECTED: errorMessageType;
    UNEXPECT: errorMessageType;
    EXPECT: errorMessageType;
    MESSAGE: errorMessageType;
  }

  interface ErrorMessage {
    new(type: errorMessageType, msgStr: string): ErrorMessage;
    type: errorMessageType;
    msgStr: string;
  }
  class ErrorMessage implements ErrorMessage {
    equal(msgA: ErrorMessage, msgB: ErrorMessage): boolean;
    messagesToString(msgs: Array<ErrorMessage>): string;
    messagesEqual(msgsA: Array<ErrorMessage>, msgsB: Array<ErrorMessage>): boolean;
  }

  interface AbstractParseError {
    pos: SourcePos;
    msgs: Array<ErrorMessage>;
    toString(): string;
    isUnknown(): boolean;
    setPosition(pos: SourcePos): AbstractParseError;
    setMessage(msgs: Array<ErrorMessage>): AbstractParseError;
    addMessage(msgs: Array<ErrorMessage>): AbstractParseError;
    setSpecificTypeMessages(type: errorMessageType, msgStrs: Array<string>): AbstractParseError;
  }

  interface ParseError extends AbstractParseError {
    new(pos: SourcePos, msgs: Array<ErrorMessage>): ParseError;
  }
  class ParseError implements ParseError {
    unknown(pos: SourcePos): ParseError;
    equal(errA: AbstractParseError, errB: AbstractParseError): boolean;
    merge(errA: AbstractParseError, errB: AbstractParseError): AbstractParseError;
  }

  interface LazyParseError extends AbstractParseError {
    new(thunk: Function): LazyParseError;
    eval(): ParseError;
  }

  interface Config {
    new(opts?: {}): Config;
    tabWidth: number;
    unicode: boolean;
  }
  class Config implements Config {
    equal(configA: Config, configB: Config): boolean;
  }

  interface State {
    new(config: Config, input: input, pos: SourcePos, userState?: any): State;
    config: Config;
    input: input;
    pos: SourcePos;
    userState?: any;
    setConfig(config: Config): State;
    setInput(input: input): State;
    setPosition(pos: SourcePos): State;
    setUserState(state: any): State;
  }
  class State implements State {
    equal(stateA: State, stateB: State, inputEqual?: Function, userStateEqual?: Function): boolean;
  }

  interface Result {
    new(consumed: boolean, success: boolean, err: AbstractParseError, val?: any, state?: State): Result;
    consumed: boolean;
    success: boolean;
    err: AbstractParseError;
    val: any;
    state: State;
  }
  class Result implements Result {
    equal(resA: Result, resB: Result, valEqual?: Function, inputEqual?: Function, userStateEqual?: Function): boolean;
    csuc(err: AbstractParseError, val: any, state: State): Result;
    cerr(err: AbstractParseError): Result;
    esuc(err: AbstractParseError, val: any, state: State): Result;
    eerr(err: AbstractParseError): Result;
  }

  interface AbstractParser extends _LoquatPrimSugar, _LoquatCharSugar, _LoquatCombinatorsSugar, _LoquatMonadSugar {
    run(state: State): Result;
  }

  interface Parser extends AbstractParser {
    new(func: Function): Parser;
  }

  interface LazyParser extends AbstractParser {
    new(thunk: Function): LazyParser;
    eval(): Parser;
  }

  interface _LoquatCore {
    show(value: any): string;
    SourcePos: SourcePos;
    ErrorMessageType: ErrorMessageType;
    ErrorMessage: ErrorMessage;
    AbstractParseError: AbstractParseError;
    ParseError: ParseError;
    LazyParseError: LazyParseError;
    uncons(input: input, unicode: boolean): {};
    Config: Config;
    State: State;
    Result: Result;
    AbstractParser: AbstractParser;
    Parser: Parser;
    LazyParser: LazyParser;
    lazy(thunk: Function): LazyParser;
    parse(parser: AbstractParser, name: string, input: input, opts?: {}): any;
    isParser(val: any): boolean;
    assertParser(val: any): void;
    extendParser(extensions: {}): void;
  }

  /*
   * loquat-prim
   */

  interface _LoquatPrim {
    map(parser: AbstractParser, func: Function): AbstractParser;
    fmap(func: Function): Function;
    pure(val: any): AbstractParser;
    return(val: any): AbstractParser;
    ap(parserA: AbstractParser, parserB: AbstractParser): AbstractParser;
    left(parserA: AbstractParser, parserB: AbstractParser): AbstractParser;
    right(parserA: AbstractParser, parserB: AbstractParser): AbstractParser;
    bind(parser: AbstractParser, func: Function): AbstractParser;
    then(parserA: AbstractParser, parserB: AbstractParser): AbstractParser;
    and(parserA: AbstractParser, parserB: AbstractParser): AbstractParser;
    fail(msgStr: string): AbstractParser;
    mzero: AbstractParser;
    mplus(parserA: AbstractParser, parserB: AbstractParser): AbstractParser;
    or(parserA: AbstractParser, parserB: AbstractParser): AbstractParser;
    label(parser: AbstractParser, labelStr: string): AbstractParser;
    labels(parser: AbstractParser, labelStrs: Array<string>): AbstractParser;
    unexpected(msgStr: string): AbstractParser;
    tryParse(parser: AbstractParser): AbstractParser;
    try(parser: AbstractParser): AbstractParser;
    lookAhead(parser: AbstractParser): AbstractParser;
    reduceMany(parser: AbstractParser, callback: Function, initVal: any): AbstractParser;
    many(parser: AbstractParser): AbstractParser;
    skipMany(parser: AbstractParser): AbstractParser;
    tokens(expectTokens: Array<any>, tokenEqual: Function, tokensToString: Function, calcNextPos: Function): AbstractParser;
    token(calcValue: Function, tokenToString: Function, calcPos: Function): AbstractParser;
    tokenPrim(calcValue: Function, tokenToString: Function, calcNextPos: Function, calcNextUserState?: Function): AbstractParser;
    getState: AbstractParser;
    setState(state: State): AbstractParser;
    updateState(func: Function): AbstractParser;
    getConfig: AbstractParser;
    setConfig(config: Config): AbstractParser;
    getInput: AbstractParser;
    setInput(input: input): AbstractParser;
    getPosition: AbstractParser;
    setPosition(pos: SourcePos): AbstractParser;
    getUserState: AbstractParser;
    setUserState(userState: any): AbstractParser;
  }

  interface _LoquatPrimSugar {
    map(func: Function): AbstractParser;
    return(val: any): AbstractParser;
    ap(parser: AbstractParser): AbstractParser;
    left(parser: AbstractParser): AbstractParser;
    skip(parser: AbstractParser): AbstractParser;
    right(parser: AbstractParser): AbstractParser;
    bind(func: Function): AbstractParser;
    and(parser: AbstractParser): AbstractParser;
    fail(msgStr: string): AbstractParser;
    or(parser: AbstractParser): AbstractParser;
    label(labelStr: string): AbstractParser;
    try(): AbstractParser;
    lookAhead(): AbstractParser;
    reduceMany(callback: Function, initVal: any): AbstractParser;
    many(): AbstractParser;
    skipMany(parser?: AbstractParser): AbstractParser;
  }

  /*
   * loquat-char
   */

  interface _LoquatChar {
    string(str: string): AbstractParser;
    satisfy(test: Function): AbstractParser;
    oneOf(str: string): AbstractParser;
    noneOf(str: string): AbstractParser;
    char(expectChar: string): AbstractParser;
    anyChar: AbstractParser;
    space: AbstractParser;
    spaces: AbstractParser;
    newline: AbstractParser;
    tab: AbstractParser;
    upper: AbstractParser;
    lower: AbstractParser;
    letter: AbstractParser;
    digit: AbstractParser;
    alphaNum: AbstractParser;
    octDigit: AbstractParser;
    hexDigit: AbstractParser;
    manyChars(parser: AbstractParser): AbstractParser;
    manyChars1(parser: AbstractParser): AbstractParser;
    regexp(re: RegExp, groupId?: number): AbstractParser;
  }

  interface _LoquatCharSugar {
    manyChars(): AbstractParser;
    manyChars1(): AbstractParser;
  }

  /*
   * loquat-combinators
   */

  interface _LoquatCombinators {
    choice(parsers: Array<AbstractParser>): AbstractParser;
    option(val: any, parser: AbstractParser):AbstractParser;
    optionMaybe(parser: AbstractParser): AbstractParser;
    optional(parser: AbstractParser): AbstractParser;
    between(open: AbstractParser, close: AbstractParser, parser: AbstractParser): AbstractParser;
    many1(parser: AbstractParser): AbstractParser;
    skipMany1(parser: AbstractParser): AbstractParser;
    sepBy(parser: AbstractParser, sep: AbstractParser): AbstractParser;
    sepBy1(parser: AbstractParser, sep: AbstractParser): AbstractParser;
    sepEndBy(parser: AbstractParser, sep: AbstractParser): AbstractParser;
    sepEndBy1(parser: AbstractParser, sep: AbstractParser): AbstractParser;
    endBy(parser: AbstractParser, sep: AbstractParser): AbstractParser;
    endBy1(parser: AbstractParser, sep: AbstractParser): AbstractParser;
    count(num: number, parser: AbstractParser): AbstractParser;
    chainl(term: AbstractParser, op: AbstractParser, defaultVal: any): AbstractParser;
    chainl1(term: AbstractParser, op: AbstractParser): AbstractParser;
    chainr(term: AbstractParser, op: AbstractParser, defaultVal: any): AbstractParser;
    chainr1(term: AbstractParser, op: AbstractParser): AbstractParser;
    anyToken: AbstractParser;
    notFollowedBy(parser: AbstractParser): AbstractParser;
    eof: AbstractParser;
    manyTill(parser: AbstractParser, end: AbstractParser): AbstractParser;
  }

  interface _LoquatCombinatorsSugar {
    between(open: AbstractParser, close: AbstractParser): AbstractParser;
    many1(): AbstractParser;
    skipMany1(parser?: AbstractParser): AbstractParser;
    sepBy(sep: AbstractParser): AbstractParser;
    sepBy1(sep: AbstractParser): AbstractParser;
    sepEndBy(sep: AbstractParser): AbstractParser;
    sepEndBy1(sep: AbstractParser): AbstractParser;
    endBy(sep: AbstractParser): AbstractParser;
    endBy1(sep :AbstractParser): AbstractParser;
    count(num: number): AbstractParser;
    notFollowedBy(parser?: AbstractParser): AbstractParser;
    manyTill(end: AbstractParser): AbstractParser;
  }

  /*
   * loquat-monad
   */

  interface _LoquatMonad {
    forever(parser: AbstractParser): AbstractParser;
    discard(parser: AbstractParser): AbstractParser;
    void(parser: AbstractParser): AbstractParser;
    join(parser: AbstractParser): AbstractParser;
    when(cond: boolean, parser: AbstractParser): AbstractParser;
    unless(cond: boolean, parser: AbstractParser): AbstractParser;
    liftM(func: Function): Function;
    liftM2(func: Function): Function;
    liftM3(func: Function): Function;
    liftM4(func: Function): Function;
    liftM5(func: Function): Function;
    ltor(funcA: Function, funcB: Function): Function;
    rtol(funcA: Function, funcB: Function): Function;
    sequence(parsers: Array<AbstractParser>): AbstractParser;
    sequence_(parsers: Array<AbstractParser>): AbstractParser;
    mapM(func: Function, arr: Array<any>): AbstractParser;
    mapM_(func: Function, arr: Array<any>): AbstractParser;
    forM(arr: Array<any>, func: Function): AbstractParser;
    forM_(arr: Array<any>, func: Function): AbstractParser;
    filterM(test: Function, arr: Array<any>): AbstractParser;
    zipWithM(func: Function, arrA: Array<any>, arrB: Array<any>): AbstractParser;
    zipWithM_(func: Function, arrA: Array<any>, arrB: Array<any>): AbstractParser;
    foldM(func: Function, initVal: any, arr: Array<any>): AbstractParser;
    foldM_(func: Function, initVal: any, arr: Array<any>): AbstractParser;
    replicateM(num: number, parser: AbstractParser): AbstractParser;
    replicateM_(num: number, parser: AbstractParser): AbstractParser;
    guard(cond: boolean): AbstractParser;
    msum(parsers: Array<AbstractParser>): AbstractParser;
    mfilter(test: Function, parser: AbstractParser): AbstractParser;
  }

  interface _LoquatMonadSugar {
    forever(): AbstractParser;
    discard(): AbstractParser;
    void(): AbstractParser;
    join(): AbstractParser;
    when(cond: boolean): AbstractParser;
    unless(cond: boolean): AbstractParser;
    filter(test: Function): AbstractParser;
  }

  /*
   * loquat-expr
   */

  type operatorType = 'infix' | 'prefix' | 'postfix';
  interface OperatorType {
    INFIX: operatorType;
    PREFIX: operatorType;
    POSTFIX: operatorType;
  }

  type operatorAssoc = 'none' | 'left' | 'right';
  interface OperatorAssoc {
    NONE: operatorAssoc;
    LEFT: operatorAssoc;
    RIGHT: operatorAssoc;
  }

  interface Operator {
    new(type: operatorType, parser: AbstractParser, assoc?: operatorAssoc): Operator;
  }

  interface _LoquatExpr {
    OperatorType: OperatorType;
    OperatorAssoc: OperatorAssoc;
    Operator: Operator;
    buildExpressionParser(opTabe: Array<Array<Operator>>, atom: AbstractParser): AbstractParser;
  }

  /*
   * loquat-qo
   */

  interface _LoquatQo {
    qo(genFunc: () => any): AbstractParser;
    do(genFunc: () => any): AbstractParser;
  }

  /*
   * loquat
   */

  interface _Loquat extends _LoquatCore, _LoquatPrim, _LoquatChar, _LoquatCombinators, _LoquatMonad, _LoquatExpr, _LoquatQo {
    exts: {
      prim: _LoquatPrim;
      char: _LoquatChar;
      combinators: _LoquatCombinators;
      monad: _LoquatMonad;
      expr: _LoquatExpr;
      qo: _LoquatQo;
    };
  }
}

declare module 'loquat' {
  function init(opts?: {}): loquat._Loquat;
  export = init;
}
