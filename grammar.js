/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: 'rad',

  extras: $ => [
    /[ \t\f\r]/,
    $.comment,
  ],

  externals: $ => [
    $._newline,
    $._indent,
    $._dedent,
  ],

  inline: $ => [
    $._simple_statement,
    $._compound_statement,
  ],

  word: $ => $.identifier,

  conflicts: $ => [
    [$.primary_expression, $.pattern],
    [$.pattern, $.assignment],
    [$.primary_expression, $.assignment],
  ],

  rules: {
    source_file: $ => repeat($._statement),

    _statement: $ => choice(
      $._simple_statement,
      $._compound_statement,
    ),

    // Simple statements end with newline
    _simple_statement: $ => choice(
      $.assignment_statement,
      $.expression_statement,
      $.return_statement,
      $.pass_statement,
      $.break_statement,
      $.continue_statement,
      $.delete_statement,
    ),

    assignment_statement: $ => seq(
      $.assignment,
      $._newline,
    ),

    expression_statement: $ => seq(
      $._expression,
      $._newline,
    ),

    return_statement: $ => seq(
      'return',
      optional($._expression),
      $._newline,
    ),

    pass_statement: $ => seq('pass', $._newline),
    break_statement: $ => seq('break', $._newline),
    continue_statement: $ => seq('continue', $._newline),
    delete_statement: $ => seq('del', $._expression, $._newline),

    // Compound statements have blocks
    _compound_statement: $ => choice(
      $.if_statement,
      $.for_statement,
      $.while_statement,
      $.function_definition,
      $.args_block,
    ),

    block: $ => seq(
      $._indent,
      repeat1($._statement),
      $._dedent,
    ),

    if_statement: $ => seq(
      'if',
      field('condition', $._expression),
      ':',
      $._newline,
      $.block,
      repeat($.elif_clause),
      optional($.else_clause),
    ),

    elif_clause: $ => seq(
      'else',
      'if',
      field('condition', $._expression),
      ':',
      $._newline,
      $.block,
    ),

    else_clause: $ => seq(
      'else',
      ':',
      $._newline,
      $.block,
    ),

    for_statement: $ => seq(
      'for',
      $.pattern,
      'in',
      $._expression,
      ':',
      $._newline,
      $.block,
    ),

    pattern: $ => choice(
      $.identifier,
      seq($.identifier, ',', $.identifier),
    ),

    while_statement: $ => seq(
      'while',
      field('condition', $._expression),
      ':',
      $._newline,
      $.block,
    ),

    function_definition: $ => seq(
      'fn',
      field('name', $.identifier),
      $.parameter_list,
      optional(seq('->', $.type)),
      ':',
      $._newline,
      $.block,
    ),

    parameter_list: $ => seq(
      '(',
      commaSep($.parameter),
      ')',
    ),

    parameter: $ => seq(
      field('name', $.identifier),
      optional($.type),
      optional(seq('=', $._expression)),
    ),

    args_block: $ => seq(
      'args',
      ':',
      $._newline,
      $._indent,
      repeat1($.arg_definition),
      $._dedent,
    ),

    arg_definition: $ => seq(
      $.identifier,
      optional($.type),
      optional(seq('=', $._expression)),
      $._newline,
    ),

    // Assignment (without newline - used in assignment_statement)
    assignment: $ => prec.right(seq(
      field('left', choice($.identifier, $.subscript, $.attribute)),
      field('operator', choice('=', '+=', '-=', '*=', '/=', '%=')),
      field('right', $._expression),
    )),

    // Expressions
    _expression: $ => choice(
      $.primary_expression,
      $.binary_expression,
      $.unary_expression,
      $.call_expression,
      $.subscript,
      $.attribute,
      $.ternary_expression,
      $.list_comprehension,
    ),

    primary_expression: $ => choice(
      $.identifier,
      $.number,
      $.string,
      $.boolean,
      $.null,
      $.list,
      $.map,
      $.parenthesized_expression,
    ),

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    binary_expression: $ => choice(
      prec.left(1, seq($._expression, 'or', $._expression)),
      prec.left(2, seq($._expression, 'and', $._expression)),
      prec.left(3, seq($._expression, choice('==', '!=', '<', '>', '<=', '>='), $._expression)),
      prec.left(4, seq($._expression, '??', $._expression)),
      prec.left(5, seq($._expression, choice('+', '-'), $._expression)),
      prec.left(6, seq($._expression, choice('*', '/', '%'), $._expression)),
      prec.left(7, seq($._expression, 'in', $._expression)),
    ),

    unary_expression: $ => choice(
      prec(8, seq('not', $._expression)),
      prec(8, seq('-', $._expression)),
    ),

    ternary_expression: $ => prec.right(1, seq(
      $._expression,
      'if',
      $._expression,
      'else',
      $._expression,
    )),

    call_expression: $ => prec(10, seq(
      field('function', choice($.identifier, $.attribute)),
      $.argument_list,
    )),

    argument_list: $ => seq(
      '(',
      commaSep(choice($._expression, $.keyword_argument)),
      ')',
    ),

    keyword_argument: $ => seq($.identifier, '=', $._expression),

    subscript: $ => prec(10, seq($._expression, '[', $._expression, ']')),

    attribute: $ => prec(10, seq($._expression, '.', $.identifier)),

    list_comprehension: $ => seq(
      '[',
      $._expression,
      'for',
      $.pattern,
      'in',
      $._expression,
      optional(seq('if', $._expression)),
      ']',
    ),

    // Literals
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    number: $ => choice($.integer, $.float),
    integer: $ => /\d(_?\d)*/,
    float: $ => /\d(_?\d)*\.\d(_?\d)*/,

    string: $ => choice(
      $.double_quoted_string,
      $.single_quoted_string,
    ),

    double_quoted_string: $ => seq(
      '"',
      repeat(choice(/[^"\\{]+/, $.escape_sequence, $.interpolation)),
      '"',
    ),

    single_quoted_string: $ => seq(
      "'",
      repeat(choice(/[^'\\{]+/, $.escape_sequence, $.interpolation)),
      "'",
    ),

    escape_sequence: $ => /\\[nrt"'\\{]/,
    interpolation: $ => seq('{', $._expression, '}'),

    boolean: $ => choice('true', 'false'),
    null: $ => 'null',

    list: $ => seq('[', commaSep($._expression), ']'),

    map: $ => seq('{', commaSep($.map_entry), '}'),
    map_entry: $ => seq(choice($.string, $.identifier), ':', $._expression),

    // Types
    type: $ => choice(
      $.simple_type,
      seq($.simple_type, '?'),
    ),
    simple_type: $ => choice('bool', 'int', 'float', 'str', 'json', 'any'),

    comment: $ => token(seq('//', /.*/)),
  },
});

function commaSep(rule) {
  return optional(seq(rule, repeat(seq(',', rule))));
}
