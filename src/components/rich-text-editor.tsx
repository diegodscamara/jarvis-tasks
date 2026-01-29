'use client'

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { useCallback, useEffect } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ content, onChange, placeholder = 'Add a description...', className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-invert max-w-none focus:outline-none min-h-[100px] px-3 py-2',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  return (
    <div className={`rounded-md border border-input bg-background ${className}`}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

function MenuBar({ editor }: { editor: Editor }) {
  const toggleBold = useCallback(() => {
    editor.chain().focus().toggleBold().run()
  }, [editor])

  const toggleItalic = useCallback(() => {
    editor.chain().focus().toggleItalic().run()
  }, [editor])

  const toggleCode = useCallback(() => {
    editor.chain().focus().toggleCode().run()
  }, [editor])

  const toggleBulletList = useCallback(() => {
    editor.chain().focus().toggleBulletList().run()
  }, [editor])

  const toggleOrderedList = useCallback(() => {
    editor.chain().focus().toggleOrderedList().run()
  }, [editor])

  const toggleTaskList = useCallback(() => {
    editor.chain().focus().toggleTaskList().run()
  }, [editor])

  const toggleCodeBlock = useCallback(() => {
    editor.chain().focus().toggleCodeBlock().run()
  }, [editor])

  const toggleBlockquote = useCallback(() => {
    editor.chain().focus().toggleBlockquote().run()
  }, [editor])

  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b border-input flex-wrap">
      <button
        type="button"
        onClick={toggleBold}
        className={`p-1.5 rounded hover:bg-muted text-xs font-bold ${editor.isActive('bold') ? 'bg-muted' : ''}`}
        title="Bold (Ctrl+B)"
      >
        B
      </button>
      <button
        type="button"
        onClick={toggleItalic}
        className={`p-1.5 rounded hover:bg-muted text-xs italic ${editor.isActive('italic') ? 'bg-muted' : ''}`}
        title="Italic (Ctrl+I)"
      >
        I
      </button>
      <button
        type="button"
        onClick={toggleCode}
        className={`p-1.5 rounded hover:bg-muted text-xs font-mono ${editor.isActive('code') ? 'bg-muted' : ''}`}
        title="Code"
      >
        {'</>'}
      </button>
      <div className="w-px h-4 bg-border mx-1" />
      <button
        type="button"
        onClick={toggleBulletList}
        className={`p-1.5 rounded hover:bg-muted text-xs ${editor.isActive('bulletList') ? 'bg-muted' : ''}`}
        title="Bullet List"
      >
        • List
      </button>
      <button
        type="button"
        onClick={toggleOrderedList}
        className={`p-1.5 rounded hover:bg-muted text-xs ${editor.isActive('orderedList') ? 'bg-muted' : ''}`}
        title="Numbered List"
      >
        1. List
      </button>
      <button
        type="button"
        onClick={toggleTaskList}
        className={`p-1.5 rounded hover:bg-muted text-xs ${editor.isActive('taskList') ? 'bg-muted' : ''}`}
        title="Checklist"
      >
        ☑ Check
      </button>
      <div className="w-px h-4 bg-border mx-1" />
      <button
        type="button"
        onClick={toggleCodeBlock}
        className={`p-1.5 rounded hover:bg-muted text-xs ${editor.isActive('codeBlock') ? 'bg-muted' : ''}`}
        title="Code Block"
      >
        {'{ }'}
      </button>
      <button
        type="button"
        onClick={toggleBlockquote}
        className={`p-1.5 rounded hover:bg-muted text-xs ${editor.isActive('blockquote') ? 'bg-muted' : ''}`}
        title="Quote"
      >
        ❝
      </button>
    </div>
  )
}
