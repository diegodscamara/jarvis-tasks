"use client"

import React, { useCallback, useState, useEffect } from 'react'
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Link from '@tiptap/extension-link'
import Mention from '@tiptap/extension-mention'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import { common, createLowlight } from 'lowlight'
import suggestion from '@tiptap/suggestion'
import { cn } from '@/lib/utils'
import { AGENTS } from '@/lib/constants'
import type { Task } from '@/types'
import tippy from 'tippy.js'
import { SlashCommands, SlashCommandItem } from './rich-text-editor/slash-commands'
import { Mentions, MentionItem } from './rich-text-editor/mentions'
import { TaskLinks, TaskLinkItem } from './rich-text-editor/task-links'

const lowlight = createLowlight(common)

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  tasks?: Task[]
}

// Custom extension for task links
const TaskLink = Mention.extend({
  name: 'taskLink',
})

// Slash command items
const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    title: 'Heading 1',
    command: '/h1',
    description: 'Large heading',
    icon: <span className="font-bold text-base">H1</span>,
  },
  {
    title: 'Heading 2',
    command: '/h2',
    description: 'Medium heading',
    icon: <span className="font-bold text-base">H2</span>,
  },
  {
    title: 'Heading 3',
    command: '/h3',
    description: 'Small heading',
    icon: <span className="font-bold text-base">H3</span>,
  },
  {
    title: 'Bullet List',
    command: '/bullet',
    description: 'Create a bullet list',
    icon: <span>•</span>,
  },
  {
    title: 'Numbered List',
    command: '/numbered',
    description: 'Create a numbered list',
    icon: <span>1.</span>,
  },
  {
    title: 'Task List',
    command: '/task',
    description: 'Create a task list',
    icon: <span>☐</span>,
  },
  {
    title: 'Code Block',
    command: '/code',
    description: 'Add a code block',
    icon: <span className="font-mono text-xs">{'{ }'}</span>,
  },
  {
    title: 'Quote',
    command: '/quote',
    description: 'Add a quote',
    icon: <span>"</span>,
  },
  {
    title: 'Divider',
    command: '/divider',
    description: 'Add a horizontal divider',
    icon: <span>—</span>,
  },
]

// Slash commands configuration
const SlashCommand = StarterKit.configure({
  heading: false,
  bulletList: false,
  orderedList: false,
  codeBlock: false,
  blockquote: false,
  horizontalRule: false,
}).extend({
  addProseMirrorPlugins() {
    return [
      suggestion({
        editor: this.editor,
        char: '/',
        command: ({ editor, range, props }: any) => {
          const item = props as SlashCommandItem
          
          // Delete the slash
          editor.chain().focus().deleteRange(range).run()
          
          // Execute the command
          switch (item.command) {
            case '/h1':
              editor.chain().focus().toggleHeading({ level: 1 }).run()
              break
            case '/h2':
              editor.chain().focus().toggleHeading({ level: 2 }).run()
              break
            case '/h3':
              editor.chain().focus().toggleHeading({ level: 3 }).run()
              break
            case '/bullet':
              editor.chain().focus().toggleBulletList().run()
              break
            case '/numbered':
              editor.chain().focus().toggleOrderedList().run()
              break
            case '/task':
              editor.chain().focus().toggleTaskList().run()
              break
            case '/code':
              editor.chain().focus().toggleCodeBlock().run()
              break
            case '/quote':
              editor.chain().focus().toggleBlockquote().run()
              break
            case '/divider':
              editor.chain().focus().setHorizontalRule().run()
              break
          }
        },
        items: ({ query }: { query: string }) => {
          return SLASH_COMMANDS.filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.command.toLowerCase().includes(query.toLowerCase())
          )
        },
        render: () => {
          let component: ReactRenderer
          let popup: any

          return {
            onStart: (props: any) => {
              component = new ReactRenderer(SlashCommands, {
                props,
                editor: props.editor,
              })

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              })
            },
            onUpdate(props: any) {
              component.updateProps(props)

              popup[0].setProps({
                getReferenceClientRect: props.clientRect,
              })
            },
            onKeyDown(props: any) {
              if (props.event.key === 'Escape') {
                popup[0].hide()
                return true
              }

              if (component.ref && typeof component.ref === 'object' && component.ref !== null && 'onKeyDown' in component.ref) {
                return (component.ref as any).onKeyDown(props)
              }
              return false
            },
            onExit() {
              popup[0].destroy()
              component.destroy()
            },
          }
        },
      }),
    ]
  },
})

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Write a description...",
  className,
  tasks = []
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      SlashCommand,
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      HorizontalRule,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        renderLabel({ options, node }) {
          return `@${node.attrs.label ?? node.attrs.id}`
        },
        suggestion: {
          char: '@',
          items: ({ query }: { query: string }) => {
            return AGENTS.filter(agent =>
              agent.name.toLowerCase().includes(query.toLowerCase())
            ).map(agent => ({
              id: agent.id,
              name: agent.name,
            }))
          },
          render: () => {
            let component: ReactRenderer
            let popup: any

            return {
              onStart: (props: any) => {
                component = new ReactRenderer(Mentions, {
                  props,
                  editor: props.editor,
                })

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                })
              },
              onUpdate(props: any) {
                component.updateProps(props)

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                })
              },
              onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                  popup[0].hide()
                  return true
                }

                if (component.ref && typeof component.ref === 'object' && component.ref !== null && 'onKeyDown' in component.ref) {
                  return (component.ref as any).onKeyDown(props)
                }
                return false
              },
              onExit() {
                popup[0].destroy()
                component.destroy()
              },
            }
          },
          command: ({ editor, range, props }: any) => {
            const item = (window as any).__mentionItem || props
            editor
              .chain()
              .focus()
              .insertContentAt(range, [
                {
                  type: 'mention',
                  attrs: {
                    id: item.id,
                    label: item.name,
                  },
                },
                {
                  type: 'text',
                  text: ' ',
                },
              ])
              .run()
          },
        },
      }),
      TaskLink.configure({
        HTMLAttributes: {
          class: 'task-link',
        },
        renderLabel({ options, node }) {
          return `#${node.attrs.label ?? node.attrs.id}`
        },
        suggestion: {
          char: '#',
          items: ({ query }: { query: string }) => {
            return tasks.filter(task =>
              task.title.toLowerCase().includes(query.toLowerCase())
            ).map(task => ({
              id: task.id,
              title: task.title,
              status: task.status,
            }))
          },
          render: () => {
            let component: ReactRenderer
            let popup: any

            return {
              onStart: (props: any) => {
                component = new ReactRenderer(TaskLinks, {
                  props,
                  editor: props.editor,
                })

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                })
              },
              onUpdate(props: any) {
                component.updateProps(props)

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                })
              },
              onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                  popup[0].hide()
                  return true
                }

                if (component.ref && typeof component.ref === 'object' && component.ref !== null && 'onKeyDown' in component.ref) {
                  return (component.ref as any).onKeyDown(props)
                }
                return false
              },
              onExit() {
                popup[0].destroy()
                component.destroy()
              },
            }
          },
          command: ({ editor, range, props }: any) => {
            const item = (window as any).__taskLinkItem || props
            editor
              .chain()
              .focus()
              .insertContentAt(range, [
                {
                  type: 'taskLink',
                  attrs: {
                    id: item.id,
                    label: item.title,
                  },
                },
                {
                  type: 'text',
                  text: ' ',
                },
              ])
              .run()
          },
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Handle slash command execution
  useEffect(() => {
    if (!editor) return
    
    const handleSlashCommand = () => {
      const item = (window as any).__slashCommand
      if (item) {
        ;(window as any).__slashCommand = null
      }
    }
    
    window.addEventListener('slashCommand', handleSlashCommand)
    return () => window.removeEventListener('slashCommand', handleSlashCommand)
  }, [editor])

  return (
    <div className="rich-text-editor border border-input rounded-md overflow-hidden">
      <div className="toolbar border-b border-border bg-muted/30 p-1.5 flex items-center gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "px-2 py-1 rounded text-xs font-medium transition-colors",
            editor.isActive('bold') 
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "px-2 py-1 rounded text-xs font-medium transition-colors",
            editor.isActive('italic') 
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={cn(
            "px-2 py-1 rounded text-xs font-medium transition-colors",
            editor.isActive('code') 
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          Code
        </button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            "px-2 py-1 rounded text-xs font-medium transition-colors",
            editor.isActive('heading', { level: 2 }) 
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            "px-2 py-1 rounded text-xs font-medium transition-colors",
            editor.isActive('heading', { level: 3 }) 
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          H3
        </button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "px-2 py-1 rounded text-xs font-medium transition-colors",
            editor.isActive('bulletList') 
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "px-2 py-1 rounded text-xs font-medium transition-colors",
            editor.isActive('orderedList') 
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          1. List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={cn(
            "px-2 py-1 rounded text-xs font-medium transition-colors",
            editor.isActive('taskList') 
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          ☐ Tasks
        </button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={cn(
            "px-2 py-1 rounded text-xs font-medium transition-colors",
            editor.isActive('codeBlock') 
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          {'{ }'}
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            "px-2 py-1 rounded text-xs font-medium transition-colors",
            editor.isActive('blockquote') 
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          "
        </button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={cn(
            "px-2 py-1 rounded text-xs font-medium transition-colors",
            'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          —
        </button>
      </div>
      <div 
        className={cn(
          "min-h-[120px] p-3 text-sm",
          "[&_.ProseMirror]:min-h-[100px] [&_.ProseMirror]:outline-none",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0",
          "[&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mt-5 [&_.ProseMirror_h1]:mb-3",
          "[&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:mt-4 [&_.ProseMirror_h2]:mb-2",
          "[&_.ProseMirror_h3]:text-base [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:mt-3 [&_.ProseMirror_h3]:mb-1",
          "[&_.ProseMirror_p]:mb-2",
          "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:mb-2",
          "[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:mb-2",
          "[&_.ProseMirror_li]:mb-1",
          "[&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:font-mono [&_.ProseMirror_code]:text-xs",
          "[&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_pre]:rounded [&_.ProseMirror_pre]:mb-2 [&_.ProseMirror_pre]:font-mono [&_.ProseMirror_pre]:text-xs",
          "[&_.ProseMirror_pre_code]:bg-transparent [&_.ProseMirror_pre_code]:p-0",
          "[&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-muted-foreground/20 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:text-muted-foreground [&_.ProseMirror_blockquote]:mb-2",
          "[&_.ProseMirror_hr]:border-border [&_.ProseMirror_hr]:my-4",
          "[&_.ProseMirror_ul[data-type='taskList']]:list-none [&_.ProseMirror_ul[data-type='taskList']]:pl-0",
          "[&_.ProseMirror_li[data-type='taskItem']]:flex [&_.ProseMirror_li[data-type='taskItem']]:items-start",
          "[&_.ProseMirror_li[data-type='taskItem']_>_label]:mr-2",
          "[&_.ProseMirror_li[data-type='taskItem']_>_label_>_input]:mt-1",
          "[&_.mention]:bg-primary/10 [&_.mention]:text-primary [&_.mention]:px-1 [&_.mention]:py-0.5 [&_.mention]:rounded [&_.mention]:font-medium",
          "[&_.task-link]:bg-blue-500/10 [&_.task-link]:text-blue-600 [&_.task-link]:px-1 [&_.task-link]:py-0.5 [&_.task-link]:rounded [&_.task-link]:font-medium",
          className
        )}
      >
        <EditorContent editor={editor} />
        <div className="text-xs text-muted-foreground mt-2">
          Type <span className="font-mono bg-muted px-1 py-0.5 rounded">/</span> for commands, 
          <span className="font-mono bg-muted px-1 py-0.5 rounded mx-1">@</span> to mention someone, 
          <span className="font-mono bg-muted px-1 py-0.5 rounded mx-1">#</span> to link a task
        </div>
      </div>
    </div>
  )
}