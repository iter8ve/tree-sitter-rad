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

    _simple_statement: $ => choice(
      $.assignment_statement,
      $.expression_statement,
      $.return_statement,
      $.yield_statement,
      $.pass_statement,
      $.break_statement,
      $.continue_statement,
      $.delete_statement,
    ),

    assignment_statement: $ => seq(
      $.assignment,
      optional($.catch_block),
      $._newline,
    ),

    expression_statement: $ => seq(
      $._expression,
      optional($.catch_block),
      $._newline,
    ),

    return_statement: $ => seq('return', optional($._expression), $._newline),
    yield_statement: $ => seq('yield', commaSep1($._expression), $._newline),
    pass_statement: $ => seq('pass', $._newline),
    break_statement: $ => seq('break', $._newline),
    continue_statement: $ => seq('continue', $._newline),
    delete_statement: $ => seq('del', $._expression, $._newline),

    catch_block: $ => seq('catch', ':', $._newline, $.block),

    _compound_statement: $ => choice(
      $.if_statement,
      $.for_statement,
      $.while_statement,
      $.function_definition,
      $.args_block,
      $.switch_statement,
      $.defer_statement,
      $.errdefer_statement,
      $.rad_block,
      $.request_block,
      $.display_block,
    ),

    block: $ => seq($._indent, repeat1($._statement), $._dedent),

    if_statement: $ => seq(
      'if', field('condition', $._expression), ':', $._newline, $.block,
      repeat($.elif_clause),
      optional($.else_clause),
    ),

    elif_clause: $ => seq('else', 'if', field('condition', $._expression), ':', $._newline, $.block),
    else_clause: $ => seq('else', ':', $._newline, $.block),

    for_statement: $ => seq('for', $.pattern, 'in', $._expression, ':', $._newline, $.block),
    pattern: $ => choice($.identifier, seq($.identifier, ',', $.identifier)),

    while_statement: $ => seq('while', field('condition', $._expression), ':', $._newline, $.block),

    function_definition: $ => seq(
      'fn', field('name', $.identifier), $.parameter_list,
      optional(seq('->', $.type)), ':', $._newline, $.block,
    ),

    parameter_list: $ => seq('(', commaSep($.parameter), ')'),
    parameter: $ => seq(field('name', $.identifier), optional($.type), optional(seq('=', $._expression))),

    args_block: $ => seq('args', ':', $._newline, $._indent, repeat1($.arg_definition), $._dedent),
    arg_definition: $ => seq($.identifier, optional($.type), optional(seq('=', $._expression)), $._newline),

    switch_statement: $ => seq(
      'switch', field('value', $._expression), ':', $._newline,
      $._indent, repeat1(choice($.case_clause, $.default_clause)), $._dedent,
    ),

    case_clause: $ => choice(
      seq('case', field('pattern', $._expression), ':', $._newline, $.block),
      seq('case', field('pattern', $._expression), '->', commaSep1($._expression), $._newline),
    ),

    default_clause: $ => choice(
      seq('default', ':', $._newline, $.block),
      seq('default', '->', commaSep1($._expression), $._newline),
    ),

    defer_statement: $ => seq('defer', ':', $._newline, $.block),
    errdefer_statement: $ => seq('errdefer', ':', $._newline, $.block),

    rad_block: $ => seq('rad', field('url', $._expression), ':', $._newline, $.rad_block_body),
    request_block: $ => seq('request', field('url', $._expression), ':', $._newline, $.rad_block_body),
    display_block: $ => seq('display', optional(field('data', $._expression)), ':', $._newline, $.rad_block_body),

    rad_block_body: $ => seq(
      $._indent,
      repeat1(choice($.fields_clause, $.sort_clause, $.field_modifier, $._statement)),
      $._dedent,
    ),

    fields_clause: $ => seq('fields', commaSep1($.identifier), $._newline),
    sort_clause: $ => seq('sort', optional($.identifier), optional(choice('asc', 'desc')), $._newline),

    field_modifier: $ => seq(commaSep1($.identifier), ':', $._newline, $._indent, repeat1($.modifier_statement), $._dedent),
    modifier_statement: $ => choice(
      seq('filter', $._expression, $._newline),
      seq('map', $._expression, $._newline),
      seq('color', $._expression, optional($._expression), $._newline),
    ),

    assignment: $ => prec.right(seq(
      field('left', choice($.identifier, $.subscript, $.attribute)),
      field('operator', choice('=', '+=', '-=', '*=', '/=', '%=')),
      field('right', $._expression),
    )),

    _expression: $ => choice(
      $.primary_expression, $.binary_expression, $.unary_expression,
      $.call_expression, $.subscript, $.attribute, $.ternary_expression,
      $.list_comprehension, $.anonymous_function,
    ),

    primary_expression: $ => choice(
      $.identifier, $.number, $.string, $.boolean, $.null,
      $.list, $.map, $.parenthesized_expression,
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
      prec.left(7, seq($._expression, 'not', 'in', $._expression)),
    ),

    unary_expression: $ => choice(
      prec(8, seq('not', $._expression)),
      prec(8, seq('-', $._expression)),
      prec.left(9, seq($._expression, '++')),
      prec.left(9, seq($._expression, '--')),
      prec.right(9, seq('++', $._expression)),
      prec.right(9, seq('--', $._expression)),
    ),

    ternary_expression: $ => prec.right(1, seq($._expression, '?', $._expression, ':', $._expression)),

    call_expression: $ => prec(10, seq(field('function', choice($.identifier, $.attribute)), $.argument_list)),
    argument_list: $ => seq('(', commaSep(choice($._expression, $.keyword_argument)), ')'),
    keyword_argument: $ => seq($.identifier, '=', $._expression),

    subscript: $ => prec(10, seq($._expression, '[', choice($._expression, $.slice), ']')),
    slice: $ => seq(optional($._expression), ':', optional($._expression)),

    attribute: $ => prec(10, seq(field('object', $._expression), '.', field('attribute', $.identifier))),

    list_comprehension: $ => seq('[', $._expression, 'for', $.pattern, 'in', $._expression, optional(seq('if', $._expression)), ']'),

    anonymous_function: $ => seq('fn', $.parameter_list, $._expression),

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    number: $ => choice($.integer, $.float),
    integer: $ => /\d(_?\d)*/,
    float: $ => /\d(_?\d)*\.\d(_?\d)*/,

    string: $ => choice($.double_quoted_string, $.single_quoted_string, $.multiline_string),
    double_quoted_string: $ => seq('"', repeat(choice(/[^"\\{]+/, $.escape_sequence, $.interpolation)), '"'),
    single_quoted_string: $ => seq("'", repeat(choice(/[^'\\{]+/, $.escape_sequence, $.interpolation)), "'"),
    multiline_string: $ => seq('"""', repeat(choice(/[^"\\{]/, $.escape_sequence, $.interpolation)), '"""'),

    escape_sequence: $ => /\\[nrt"'\\{]/,
    interpolation: $ => seq('{', $._expression, optional(seq(':', /[^}]+/)), '}'),

    boolean: $ => choice('true', 'false'),
    null: $ => 'null',

    list: $ => seq('[', commaSep($._expression), ']'),
    map: $ => seq('{', commaSep($.map_entry), '}'),
    map_entry: $ => seq(choice($.string, $.identifier), ':', $._expression),

    type: $ => choice($.simple_type, seq($.simple_type, '?'), seq($.simple_type, '|', $.type)),
    simple_type: $ => choice('bool', 'int', 'float', 'str', 'json', 'any', 'list', 'map'),

    comment: $ => token(seq('//', /.*/)),
  },
});

function commaSep(rule) { return optional(seq(rule, repeat(seq(',', rule)))); }
function commaSep1(rule) { return seq(rule, repeat(seq(',', rule))); }
