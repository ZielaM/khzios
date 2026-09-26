'use client';

import { useState } from 'react';
import {
  EditorContent,
  mergeAttributes,
  Node,
  useEditor,
  useEditorState,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import clsx from 'clsx';
import style from './editor.module.scss';

declare module '@tiptap/react' {
  interface Commands<ReturnType> {
    highlightBox: { toggleHighlightBox: () => ReturnType };
  }
}

// The article's highlighted box: <div class="highlight-box">
const HighlightBox = Node.create({
  name: 'highlightBox',
  group: 'block',
  content: 'block+',
  defining: true,
  parseHTML: () => [{ tag: 'div.highlight-box' }],
  renderHTML: ({ HTMLAttributes }) => [
    'div',
    mergeAttributes(HTMLAttributes, { class: 'highlight-box' }),
    0,
  ],
  addCommands() {
    return {
      toggleHighlightBox:
        () =>
        ({ commands }) =>
          this.editor.isActive(this.name)
            ? commands.lift(this.name)
            : commands.wrapIn(this.name),
    };
  },
});

interface RichTextEditorProps {
  name: string;
  label: string;
  defaultValue?: string;
}

/**
 * Article editor limited to the formatting the site styles (and the server
 * keeps, see sanitizeArticleHtml): headings, bold, italics, lists, quotes,
 * links and the highlighted box. The HTML goes into a hidden input.
 */
export default function RichTextEditor({
  name,
  label,
  defaultValue = '',
}: RichTextEditorProps) {
  const [html, setHtml] = useState(defaultValue);
  const labelId = `${name}-label`;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        horizontalRule: false,
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: null, target: null },
        },
      }),
      HighlightBox,
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        class: style.content,
        'aria-labelledby': labelId,
        role: 'textbox',
        'aria-multiline': 'true',
      },
    },
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  const state = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor && {
        h2: editor.isActive('heading', { level: 2 }),
        h3: editor.isActive('heading', { level: 3 }),
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        bulletList: editor.isActive('bulletList'),
        orderedList: editor.isActive('orderedList'),
        blockquote: editor.isActive('blockquote'),
        highlightBox: editor.isActive('highlightBox'),
        link: editor.isActive('link'),
      },
  });

  const setLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt(
      'Adres linku (https://…, mailto:… albo /pl/…). Pusty usuwa link.',
      previous ?? 'https://'
    );
    if (url === null) return;
    if (url.trim() === '') editor.chain().focus().unsetLink().run();
    else
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url.trim() })
        .run();
  };

  const buttons: { label: string; active?: boolean; run: () => void }[] = editor
    ? [
        {
          label: 'Nagłówek',
          active: state?.h2,
          run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        },
        {
          label: 'Podtytuł',
          active: state?.h3,
          run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        },
        {
          label: 'Pogrubienie',
          active: state?.bold,
          run: () => editor.chain().focus().toggleBold().run(),
        },
        {
          label: 'Kursywa',
          active: state?.italic,
          run: () => editor.chain().focus().toggleItalic().run(),
        },
        {
          label: 'Lista',
          active: state?.bulletList,
          run: () => editor.chain().focus().toggleBulletList().run(),
        },
        {
          label: 'Lista numerowana',
          active: state?.orderedList,
          run: () => editor.chain().focus().toggleOrderedList().run(),
        },
        {
          label: 'Cytat',
          active: state?.blockquote,
          run: () => editor.chain().focus().toggleBlockquote().run(),
        },
        {
          label: 'Wyróżnienie',
          active: state?.highlightBox,
          run: () => editor.chain().focus().toggleHighlightBox().run(),
        },
        { label: 'Link', active: state?.link, run: setLink },
        { label: 'Cofnij', run: () => editor.chain().focus().undo().run() },
        { label: 'Ponów', run: () => editor.chain().focus().redo().run() },
      ]
    : [];

  return (
    <div className={style.editor}>
      <span id={labelId} className={style.label}>
        {label}
      </span>
      <div
        role="toolbar"
        aria-label={`Formatowanie: ${label}`}
        className={style.toolbar}
      >
        {buttons.map((button) => (
          <button
            key={button.label}
            type="button"
            className={clsx(
              style.toolButton,
              button.active && style.activeTool
            )}
            aria-pressed={
              button.active === undefined ? undefined : button.active
            }
            onClick={button.run}
          >
            {button.label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
