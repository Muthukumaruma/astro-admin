import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Image as ImageIcon, Undo, Redo,
} from 'lucide-react';
import { uploadCmsImage } from '../api/cms.api';
import { ResizableImage } from './resizable-image';

interface TiptapEditorProps {
  content: JSONContent | null;
  onChange: (json: JSONContent) => void;
}

function ToolbarButton({ active, onClick, title, children }: {
  active?: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors ${
        active ? 'bg-indigo-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);

  const [, forceUpdate] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ResizableImage,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start writing your book content…' }),
    ],
    content: content ?? '',
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    onSelectionUpdate: () => forceUpdate(n => n + 1),
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm sm:prose-base max-w-none focus:outline-none min-h-[300px] px-4 py-3',
      },
    },
  });

  // Load async-fetched content once into the editor without re-triggering on every keystroke.
  useEffect(() => {
    if (!editor || loadedRef.current || !content) return;
    editor.commands.setContent(content);
    loadedRef.current = true;
  }, [editor, content]);

  async function insertImage(file: File) {
    if (!editor) return;
    try {
      const url = await uploadCmsImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      // upload failed — silently ignore, user can retry
    }
  }

  if (!editor) return null;

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', previous ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-white/10 bg-black/20 sticky top-0 z-10">
        <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <ToolbarButton title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <ToolbarButton title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Justify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
          <AlignJustify className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Insert image" onClick={() => fileInputRef.current?.click()}>
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="w-4 h-4" />
        </ToolbarButton>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) insertImage(file);
            e.target.value = '';
          }}
        />
      </div>

      {/* Image controls — shown when an image is selected */}
      {editor.isActive('image') && (
        <div className="flex flex-wrap items-center gap-2 px-2 py-1.5 border-b border-white/10 bg-black/20 text-xs text-white/60">
          <span>Image size:</span>
          {(['25%', '50%', '75%', '100%'] as const).map(size => (
            <button
              key={size}
              type="button"
              onClick={() => editor.chain().focus().updateAttributes('image', { width: size }).run()}
              className={`px-2 py-1 rounded-md transition-colors ${
                editor.getAttributes('image').width === size ? 'bg-indigo-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {size}
            </button>
          ))}
          <button
            type="button"
            onClick={() => editor.chain().focus().updateAttributes('image', { width: null }).run()}
            className={`px-2 py-1 rounded-md transition-colors ${
              !editor.getAttributes('image').width ? 'bg-indigo-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            Reset
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <span>Align:</span>
          <ToolbarButton
            title="Align image left (wrap text)"
            active={editor.getAttributes('image').align === 'left'}
            onClick={() => editor.chain().focus().updateAttributes('image', { align: 'left' }).run()}
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Center image"
            active={editor.getAttributes('image').align === 'center' || !editor.getAttributes('image').align}
            onClick={() => editor.chain().focus().updateAttributes('image', { align: 'center' }).run()}
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Align image right (wrap text)"
            active={editor.getAttributes('image').align === 'right'}
            onClick={() => editor.chain().focus().updateAttributes('image', { align: 'right' }).run()}
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>
        </div>
      )}

      {/* Editor surface */}
      <div className="text-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
