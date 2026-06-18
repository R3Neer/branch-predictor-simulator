import { cpp } from "@codemirror/lang-cpp";
import { useMemo } from "react";
import { CodeEditor } from "./CodeEditor";

export interface CSourceEditorProps {
  readonly value: string;
  readonly readOnly: boolean;
  readonly onChange: (value: string) => void;
}

export function CSourceEditor({ value, readOnly, onChange }: CSourceEditorProps) {
  const extensions = useMemo(() => [cpp()], []);

  return <CodeEditor ariaLabel="Didactic C" value={value} readOnly={readOnly} extensions={extensions} onChange={onChange} />;
}
