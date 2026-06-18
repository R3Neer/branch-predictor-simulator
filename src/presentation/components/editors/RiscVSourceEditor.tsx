import { useMemo } from "react";
import { CodeEditor } from "./CodeEditor";
import { riscvSemanticHighlighting } from "./semanticHighlighting";

export interface RiscVSourceEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export function RiscVSourceEditor({ value, onChange }: RiscVSourceEditorProps) {
  const extensions = useMemo(() => [riscvSemanticHighlighting()], []);

  return <CodeEditor ariaLabel="RISC-V" value={value} extensions={extensions} onChange={onChange} />;
}
