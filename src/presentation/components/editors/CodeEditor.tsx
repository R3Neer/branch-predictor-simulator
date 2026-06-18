import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { useEffect, useMemo, useRef } from "react";
import { simulatorCodeMirrorTheme } from "./codeMirrorTheme";

export interface CodeEditorProps {
  readonly ariaLabel: string;
  readonly value: string;
  readonly readOnly?: boolean;
  readonly extensions?: readonly Extension[];
  readonly onChange: (value: string) => void;
}

export function CodeEditor({
  ariaLabel,
  value,
  readOnly = false,
  extensions = [],
  onChange
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const initialExtensionsRef = useRef(extensions);
  const initialReadOnlyRef = useRef(readOnly);
  const initialValueRef = useRef(value);
  const languageCompartment = useMemo(() => new Compartment(), []);
  const readOnlyCompartment = useMemo(() => new Compartment(), []);

  onChangeRef.current = onChange;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const view = new EditorView({
      parent: container,
      state: EditorState.create({
        doc: initialValueRef.current,
        extensions: [
          lineNumbers(),
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ "aria-label": ariaLabel }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
          readOnlyCompartment.of(readOnlyExtensions(initialReadOnlyRef.current)),
          languageCompartment.of(initialExtensionsRef.current),
          simulatorCodeMirrorTheme
        ]
      })
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [ariaLabel, languageCompartment, readOnlyCompartment]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }

    const currentValue = view.state.doc.toString();
    if (currentValue !== value) {
      view.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value }
      });
    }
  }, [value]);

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: readOnlyCompartment.reconfigure(readOnlyExtensions(readOnly))
    });
  }, [readOnly, readOnlyCompartment]);

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: languageCompartment.reconfigure(extensions)
    });
  }, [extensions, languageCompartment]);

  return <div ref={containerRef} />;
}

function readOnlyExtensions(readOnly: boolean): readonly Extension[] {
  return [EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)];
}
