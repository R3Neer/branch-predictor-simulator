import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import type { SemanticTokenType } from "./semanticTokens";
import { tokenizeManualSequence, tokenizeRiscV } from "./semanticTokens";

const tokenClassNames: Record<SemanticTokenType, string> = {
  address: "cm-semantic-address",
  branchId: "cm-semantic-branch-id",
  comment: "cm-semantic-comment",
  immediate: "cm-semantic-immediate",
  keyword: "cm-semantic-keyword",
  label: "cm-semantic-label",
  mnemonic: "cm-semantic-mnemonic",
  option: "cm-semantic-option",
  range: "cm-semantic-range",
  register: "cm-semantic-register",
  repetition: "cm-semantic-repetition"
};

export function riscvSemanticHighlighting() {
  return semanticHighlighting((source) => tokenizeRiscV(source));
}

export function manualSequenceSemanticHighlighting() {
  return semanticHighlighting((source) => tokenizeManualSequence(source));
}

function semanticHighlighting(tokenize: (source: string) => ReturnType<typeof tokenizeRiscV>) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildDecorations(view, tokenize);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildDecorations(update.view, tokenize);
        }
      }
    },
    {
      decorations: (plugin) => plugin.decorations
    }
  );
}

function buildDecorations(view: EditorView, tokenize: (source: string) => ReturnType<typeof tokenizeRiscV>) {
  const builder = new RangeSetBuilder<Decoration>();
  let lastTo = 0;

  for (const token of tokenize(view.state.doc.toString())) {
    if (token.from < lastTo || token.from === token.to) {
      continue;
    }

    builder.add(token.from, token.to, Decoration.mark({ class: tokenClassNames[token.type] }));
    lastTo = token.to;
  }

  return builder.finish();
}
