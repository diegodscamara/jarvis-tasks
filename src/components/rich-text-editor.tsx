'use client'

import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import Placeholder from '@tiptap/extension-placeholder'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import StarterKit from '@tiptap/starter-kit'
import { useCallback, useEffect } from 'react'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Add a description...',
  className,
}: RichTextEditorProps) {
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
        class:
          'prose prose-sm prose-invert max-w-none focus:outline-none min-h-[100px] px-3 py-2',
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
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={toggleBold}
        aria-label="Bold"
        title="Bold (Ctrl+B)"
        className="font-bold"
      >
        B
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={toggleItalic}
        aria-label="Italic"
        title="Italic (Ctrl+I)"
        className="italic"
      >
        I
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('code')}
        onPressedChange={toggleCode}
        aria-label="Code"
        title="Code"
        className="font-mono"
      >
        {'</>'}
      </Toggle>
      <Separator orientation="vertical" className="h-4 mx-1" />
      <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={toggleBulletList}
        aria-label="Bullet List"
        title="Bullet List"
      >
        • List
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={toggleOrderedList}
        aria-label="Numbered List"
        title="Numbered List"
      >
        1. List
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('taskList')}
        onPressedChange={toggleTaskList}
        aria-label="Checklist"
        title="Checklist"
      >
        ☑ Check
      </Toggle>
      <Separator orientation="vertical" className="h-4 mx-1" />
      <Toggle
        size="sm"
        pressed={editor.isActive('codeBlock')}
        onPressedChange={toggleCodeBlock}
        aria-label="Code Block"
        title="Code Block"
      >
        {'{ }'}
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('blockquote')}
        onPressedChange={toggleBlockquote}
        aria-label="Quote"
        title="Quote"
      >
        ❝
      </Toggle>
    </div>
  )
}
