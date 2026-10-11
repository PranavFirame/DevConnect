'use client';

import React, { useState } from 'react';
import { 
  Code, 
  Bold, 
  Italic, 
  List, 
  Link as LinkIcon, 
  Eye, 
  Edit3, 
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write in Markdown. Code blocks supported with ```language...',
  minHeight = 'min-h-[220px]',
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [copied, setCopied] = useState(false);

  // Quick formatting helpers
  const insertSyntax = (before: string, after: string = '') => {
    const textarea = document.getElementById('markdown-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || 'text';
    const replacement = `${before}${selectedText}${after}`;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 50);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Safe client-side markdown to html generator
  const renderPreview = (content: string) => {
    if (!content.trim()) {
      return '<p class="text-slate-400 italic">Nothing to preview yet.</p>';
    }

    // Escape raw HTML tags for XSS protection
    let safe = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks ```code```
    safe = safe.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre class="my-3 p-3 bg-slate-900 text-slate-100 rounded-lg text-xs overflow-x-auto"><code>${code.trim()}</code></pre>`;
    });

    // Inline code `code`
    safe = safe.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs">$1</code>');

    // Headers
    safe = safe.replace(/^### (.*$)/gim, '<h3 class="text-base font-bold my-2 text-slate-900 dark:text-white">$1</h3>');
    safe = safe.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold my-2 text-slate-900 dark:text-white">$1</h2>');
    safe = safe.replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold my-3 text-slate-900 dark:text-white">$1</h1>');

    // Bold & Italics
    safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Links [title](url) - strictly sanitize scheme
    safe = safe.replace(/\[(.*?)\]\((https?:\/\/.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline font-medium">$1</a>');

    // Lists
    safe = safe.replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc text-sm">$1</li>');

    // Paragraph line breaks
    safe = safe.replace(/\n\n/g, '<br/><br/>');

    return safe;
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div className="border-2 border-zinc-900 dark:border-zinc-700 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 brutal-card">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b-2 border-zinc-900 dark:border-zinc-700 px-3 py-2 bg-[#fbf9f5] dark:bg-zinc-800">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'write'
                ? 'bg-zinc-900 text-white dark:bg-[#42ed91] dark:text-zinc-900 shadow-[2px_2px_0px_0px_#42ed91]'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Edit3 className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Write</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'preview'
                ? 'bg-zinc-900 text-white dark:bg-[#42ed91] dark:text-zinc-900 shadow-[2px_2px_0px_0px_#42ed91]'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Eye className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Preview</span>
          </button>
        </div>

        {/* Action formatting buttons */}
        {activeTab === 'write' && (
          <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
            <button
              type="button"
              onClick={() => insertSyntax('**', '**')}
              title="Bold"
              className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertSyntax('*', '*')}
              title="Italic"
              className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <Italic className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertSyntax('```typescript\n', '\n```')}
              title="Code Block"
              className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <Code className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertSyntax('- ')}
              title="Bullet List"
              className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertSyntax('[', '](https://)')}
              title="Link"
              className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleCopy}
          title="Copy Markdown"
          className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[#42ed91]" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Editor Body */}
      {activeTab === 'write' ? (
        <textarea
          id="markdown-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full p-4 text-sm font-mono text-zinc-900 dark:text-zinc-100 bg-transparent border-none focus:outline-none resize-y ${minHeight}`}
        />
      ) : (
        <div
          className={`p-4 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 overflow-y-auto ${minHeight}`}
          dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
        />
      )}

      {/* Stats footer */}
      <div className="flex items-center justify-between border-t-2 border-zinc-900 dark:border-zinc-700 px-3.5 py-2 text-[11px] font-bold text-zinc-500 bg-[#fbf9f5] dark:bg-zinc-800">
        <span className="flex items-center gap-1">
          <HelpCircle className="h-3 w-3" />
          Markdown and syntax highlighting supported
        </span>
        <div className="flex items-center gap-3">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
        </div>
      </div>
    </div>
  );
}
