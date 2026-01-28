package tree_sitter_rad_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/tree-sitter/tree-sitter-rad"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_rad.Language())
	if language == nil {
		t.Errorf("Error loading Rad grammar")
	}
}
