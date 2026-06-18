import { useMemo } from "react";
import { CodeEditor } from "./CodeEditor";
import { manualSequenceSemanticHighlighting } from "./semanticHighlighting";

export interface ManualSequenceEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export function ManualSequenceEditor({ value, onChange }: ManualSequenceEditorProps) {
  const extensions = useMemo(() => [manualSequenceSemanticHighlighting()], []);

  return <CodeEditor ariaLabel="Manual sequence" value={value} extensions={extensions} onChange={onChange} />;
}
