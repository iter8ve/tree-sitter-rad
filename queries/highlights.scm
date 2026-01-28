; Keywords
[
  "args"
  "rad"
  "display"
  "request"
  "fn"
  "if"
  "else"
  "for"
  "while"
  "in"
  "switch"
  "case"
  "default"
  "return"
  "yield"
  "break"
  "continue"
  "pass"
  "defer"
  "del"
  "catch"
] @keyword

[
  "and"
  "or"
  "not"
] @keyword.operator

; Modifiers
[
  "fields"
  "sort"
  "asc"
  "desc"
] @keyword.modifier

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
(arg_comment) @comment.documentation
(doc_block) @comment.documentation

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

; Shell commands
(shell_command) @string.special
(shell_content) @string.special

; Special
(shebang) @keyword.directive

; Argument definitions
(arg_definition
  (identifier) @variable.parameter)
