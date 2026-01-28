#include "tree_sitter/alloc.h"
#include "tree_sitter/array.h"
#include "tree_sitter/parser.h"

#include <stdint.h>
#include <string.h>

enum TokenType {
    NEWLINE,
    INDENT,
    DEDENT,
};

typedef struct {
    Array(uint16_t) indents;
    uint16_t pending_indent_length;
    bool has_pending_indent;
} Scanner;

static inline void skip(TSLexer *lexer) { lexer->advance(lexer, true); }

void *tree_sitter_rad_external_scanner_create() {
    Scanner *scanner = ts_calloc(1, sizeof(Scanner));
    array_init(&scanner->indents);
    array_push(&scanner->indents, 0);
    scanner->pending_indent_length = 0;
    scanner->has_pending_indent = false;
    return scanner;
}

void tree_sitter_rad_external_scanner_destroy(void *payload) {
    Scanner *scanner = (Scanner *)payload;
    array_delete(&scanner->indents);
    ts_free(scanner);
}

unsigned tree_sitter_rad_external_scanner_serialize(void *payload, char *buffer) {
    Scanner *scanner = (Scanner *)payload;

    size_t size = 0;
    
    buffer[size++] = scanner->has_pending_indent ? 1 : 0;
    buffer[size++] = (char)(scanner->pending_indent_length & 0xFF);
    buffer[size++] = (char)((scanner->pending_indent_length >> 8) & 0xFF);
    
    uint32_t indent_count = scanner->indents.size;
    if (indent_count > 100) indent_count = 100;
    buffer[size++] = (char)indent_count;

    for (uint32_t i = 0; i < indent_count; i++) {
        uint16_t indent = scanner->indents.contents[i];
        buffer[size++] = (char)(indent & 0xFF);
        buffer[size++] = (char)((indent >> 8) & 0xFF);
    }

    return size;
}

void tree_sitter_rad_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
    Scanner *scanner = (Scanner *)payload;

    array_clear(&scanner->indents);
    scanner->has_pending_indent = false;
    scanner->pending_indent_length = 0;

    if (length == 0) {
        array_push(&scanner->indents, 0);
        return;
    }

    size_t pos = 0;
    
    scanner->has_pending_indent = buffer[pos++] != 0;
    scanner->pending_indent_length = (uint8_t)buffer[pos++];
    scanner->pending_indent_length |= ((uint16_t)(uint8_t)buffer[pos++]) << 8;
    
    uint32_t indent_count = (uint8_t)buffer[pos++];

    for (uint32_t i = 0; i < indent_count && pos + 1 < length; i++) {
        uint16_t indent = (uint8_t)buffer[pos++];
        indent |= ((uint16_t)(uint8_t)buffer[pos++]) << 8;
        array_push(&scanner->indents, indent);
    }

    if (scanner->indents.size == 0) {
        array_push(&scanner->indents, 0);
    }
}

bool tree_sitter_rad_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
    Scanner *scanner = (Scanner *)payload;
    uint16_t current_indent = *array_back(&scanner->indents);

    // First check for pending INDENT or DEDENT from previous NEWLINE
    if (scanner->has_pending_indent) {
        uint16_t new_indent = scanner->pending_indent_length;
        
        // Handle INDENT
        if (valid_symbols[INDENT] && new_indent > current_indent) {
            array_push(&scanner->indents, new_indent);
            scanner->has_pending_indent = false;
            lexer->result_symbol = INDENT;
            return true;
        }
        
        // Handle DEDENT (may need multiple)
        if (valid_symbols[DEDENT] && new_indent < current_indent && scanner->indents.size > 1) {
            array_pop(&scanner->indents);
            uint16_t next_indent = *array_back(&scanner->indents);
            if (new_indent >= next_indent) {
                scanner->has_pending_indent = false;
            }
            lexer->result_symbol = DEDENT;
            return true;
        }
        
        // Same level - clear pending
        if (new_indent == current_indent) {
            scanner->has_pending_indent = false;
        }
    }

    // Handle dedent at end of file
    if (lexer->eof(lexer) && valid_symbols[DEDENT] && scanner->indents.size > 1) {
        array_pop(&scanner->indents);
        lexer->result_symbol = DEDENT;
        return true;
    }

    // If we're looking at a newline and NEWLINE is valid, consume it
    if (lexer->lookahead == '\n' && valid_symbols[NEWLINE]) {
        skip(lexer);

        uint16_t indent_length = 0;
        while (lexer->lookahead == ' ') {
            indent_length++;
            skip(lexer);
        }
        while (lexer->lookahead == '\t') {
            indent_length += 4;
            skip(lexer);
        }

        // Skip blank lines
        while (lexer->lookahead == '\n' || lexer->lookahead == '\r') {
            skip(lexer);
            indent_length = 0;
            while (lexer->lookahead == ' ') {
                indent_length++;
                skip(lexer);
            }
            while (lexer->lookahead == '\t') {
                indent_length += 4;
                skip(lexer);
            }
        }

        scanner->pending_indent_length = indent_length;
        scanner->has_pending_indent = true;

        lexer->mark_end(lexer);
        lexer->result_symbol = NEWLINE;
        return true;
    }

    return false;
}
