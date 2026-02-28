import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { lineNumbers, keymap } from '@codemirror/view';
import { defaultKeymap, indentWithTab, undo, redo, indentMore, indentLess } from '@codemirror/commands';
import Codicon from './Codicon';

export interface MarkdownEditorHandle {
  runCommand: (cmd: string) => void;
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  showToolbar?: boolean;
}

function wrapSelection(view: EditorView, before: string, after: string, placeholder = 'text') {
  const { from, to } = view.state.selection.main;
  const text = view.state.sliceDoc(from, to) || placeholder;
  view.dispatch({
    changes: { from, to, insert: before + text + after },
    selection: { anchor: from + before.length, head: to + before.length },
  });
}

function insertAtCursor(view: EditorView, text: string, cursorOffset?: number) {
  const { from } = view.state.selection.main;
  view.dispatch({
    changes: { from, insert: text },
    selection: { anchor: from + (cursorOffset ?? text.length), head: from + (cursorOffset ?? text.length) },
  });
}

function insertLinePrefix(view: EditorView, prefix: string) {
  const { from } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);
  view.dispatch({
    changes: { from: line.from, insert: prefix },
    selection: { anchor: from + prefix.length, head: from + prefix.length },
  });
}

function getTodayDate() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

export const TOOLBAR_BUTTONS = [
  { cmd: 'undo', icon: 'arrow-left', title: 'Undo' },
  { cmd: 'redo', icon: 'redo', title: 'Redo' },
  { cmd: 'bold', icon: 'bold', title: 'Bold' },
  { cmd: 'italic', icon: 'italic', title: 'Italic' },
  { cmd: 'strike', icon: 'strikethrough', title: 'Strikethrough' },
  { cmd: 'h1', icon: 'symbol-method', title: 'Heading 1' },
  { cmd: 'h2', icon: 'symbol-method', title: 'Heading 2' },
  { cmd: 'h3', icon: 'symbol-method', title: 'Heading 3' },
  { cmd: 'inlineCode', icon: 'code', title: 'Inline code' },
  { cmd: 'tab', icon: 'indent', title: 'Indent' },
  { cmd: 'detab', icon: 'fold-up', title: 'Outdent' },
  { cmd: 'quote', icon: 'quote', title: 'Quote' },
  { cmd: 'link', icon: 'link', title: 'Link' },
  { cmd: 'image', icon: 'file-media', title: 'Image' },
  { cmd: 'orderedList', icon: 'list-ordered', title: 'Ordered list' },
  { cmd: 'unorderedList', icon: 'list-unordered', title: 'Unordered list' },
  { cmd: 'checkList', icon: 'checklist', title: 'Check list' },
  { cmd: 'codeBlock', icon: 'code', title: 'Code block' },
  { cmd: 'table', icon: 'table', title: 'Table' },
  { cmd: 'divider', icon: 'horizontal-rule', title: 'Divider' },
  { cmd: 'date', icon: 'calendar', title: 'Insert date' },
];

const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(function MarkdownEditor(
  { value, onChange, minHeight = '300px', showToolbar = false },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const runCommand = useCallback((cmd: string) => {
    const view = viewRef.current;
    if (!view) return;
    switch (cmd) {
      case 'undo':
        undo(view);
        break;
      case 'redo':
        redo(view);
        break;
      case 'bold':
        wrapSelection(view, '**', '**');
        break;
      case 'italic':
        wrapSelection(view, '*', '*');
        break;
      case 'strike':
        wrapSelection(view, '~~', '~~');
        break;
      case 'h1':
        insertLinePrefix(view, '# ');
        break;
      case 'h2':
        insertLinePrefix(view, '## ');
        break;
      case 'h3':
        insertLinePrefix(view, '### ');
        break;
      case 'inlineCode':
        wrapSelection(view, '`', '`', 'code');
        break;
      case 'tab':
        indentMore(view);
        break;
      case 'detab':
        indentLess(view);
        break;
      case 'quote':
        insertLinePrefix(view, '> ');
        break;
      case 'link':
        wrapSelection(view, '[', '](url)', 'link text');
        break;
      case 'image':
        insertAtCursor(view, '![alt](url)');
        break;
      case 'orderedList':
        insertLinePrefix(view, '1. ');
        break;
      case 'unorderedList':
        insertLinePrefix(view, '- ');
        break;
      case 'checkList':
        insertLinePrefix(view, '- [ ] ');
        break;
      case 'codeBlock':
        insertAtCursor(view, '```\n\n```', 4);
        break;
      case 'table':
        insertAtCursor(view, '| | |\n|---|---|\n| | |', 2);
        break;
      case 'divider':
        insertAtCursor(view, '\n---\n');
        break;
      case 'date':
        insertAtCursor(view, getTodayDate());
        break;
    }
  }, []);

  useImperativeHandle(ref, () => ({ runCommand }), [runCommand]);

  useEffect(() => {
    if (!containerRef.current) return;
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
    const view = new EditorView({ state, parent: containerRef.current });
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

  return (
    <div className="markdown-editor-wrapper">
      {showToolbar && (
        <div className="markdown-editor-toolbar">
          {TOOLBAR_BUTTONS.map(({ cmd, icon, title }) => (
            <button
              key={cmd}
              type="button"
              className="obsidian-icon-btn"
              title={title}
              onClick={() => runCommand(cmd)}
            >
              <Codicon name={icon} size={16} />
            </button>
          ))}
        </div>
      )}
      <div ref={containerRef} style={{ minHeight }} className="cm-editor" />
    </div>
  );
});

export default MarkdownEditor;
