import { useEffect, useRef } from 'react';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { lineNumbers, keymap } from '@codemirror/view';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function MarkdownEditor({ value, onChange, minHeight = '300px' }: MarkdownEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        markdown(),
        keymap.of([...defaultKeymap, indentWithTab]),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) {
            onChange(u.state.doc.toString());
          }
        }),
      ],
    });
    const view = new EditorView({ state, parent: ref.current });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || value === view.state.doc.toString()) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    });
  }, [value]);

  return <div ref={ref} style={{ minHeight }} className="cm-editor" />;
}
