; Keywords
[
  "args"
  "fn"
  "if"
  "else"
  "for"
  "while"
  "in"
  "return"
  "yield"
  "break"
  "continue"
  "pass"
  "del"
  "switch"
  "case"
  "default"
  "defer"
  "errdefer"
  "catch"
  "rad"
  "request"
  "display"
  "fields"
  "sort"
  "filter"
  "map"
  "color"
] @keyword

[
  "asc"
  "desc"
] @keyword.modifier

[
  "and"
  "or"
  "not"
] @keyword.operator

; Types
(simple_type) @type.builtin
(type) @type

; Functions
(function_definition
  name: (identifier) @function)

(call_expression
  function: (identifier) @function.call)

(call_expression
  function: (attribute
    attribute: (identifier) @function.method.call))

(anonymous_function) @function

; Parameters
(parameter
  name: (identifier) @variable.parameter)

; Variables
(identifier) @variable

(attribute
  attribute: (identifier) @property)

; Literals
(string) @string
(escape_sequence) @string.escape
(interpolation
  "{" @punctuation.special
  "}" @punctuation.special)

(integer) @number
(float) @number.float

(boolean) @constant.builtin.boolean
(null) @constant.builtin

; Comments
(comment) @comment

; Operators
[
  "="
  "+="
  "-="
  "*="
  "/="
  "%="
  "+"
  "-"
  "*"
  "/"
  "%"
  "=="
  "!="
  "<"
  ">"
  "<="
  ">="
  "??"
  "->"
  "++"
  "--"
  "?"
] @operator

; Punctuation
[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

[
  ","
  ":"
  "."
] @punctuation.delimiter

; Argument definitions
(arg_definition
  (identifier) @variable.parameter)

; Field references in rad blocks
(fields_clause
  (identifier) @property)

(sort_clause
  (identifier) @property)

(field_modifier
  (identifier) @property)
