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
      return '<p class="text-zinc-400 italic">Nothing to preview yet.</p>';
    }

    // Escape raw HTML tags for XSS protection
    let safe = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks ```code```
    safe = safe.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre class="my-3 p-3 bg-[#111318] text-[#E5E7EB] border border-[#232731] rounded-xl text-xs overflow-x-auto"><code>${code.trim()}</code></pre>`;
    });

    // Inline code `code`
    safe = safe.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-[#F0F2F5] dark:bg-[#1E2129] text-[#F45170] text-xs font-mono">$1</code>');

    // Headers
    safe = safe.replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold my-2 text-[#17181D] dark:text-white">$1</h3>');
    safe = safe.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold my-2.5 text-[#17181D] dark:text-white">$1</h2>');
    safe = safe.replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold my-3 text-[#17181D] dark:text-white">$1</h1>');

    // Bold & Italics
    safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Links [title](url)
    safe = safe.replace(/\[(.*?)\]\((https?:\/\/.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#F45170] hover:underline font-medium">$1</a>');

    // Lists
    safe = safe.replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc text-xs sm:text-sm my-0.5">$1</li>');

    // Paragraph line breaks
    safe = safe.replace(/\n\n/g, '<br/><br/>');

    return safe;
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div className="dev-card overflow-hidden">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#E5E7EB] dark:border-[#282C37] px-3.5 py-2 bg-[#FAFBFD] dark:bg-[#1A1D24]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'write'
                ? 'bg-white dark:bg-[#16181E] text-[#F45170] shadow-xs'
                : 'text-[#697386] dark:text-[#9CA3AF] hover:text-[#17181D]'
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Write</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-[#16181E] text-[#F45170] shadow-xs'
                : 'text-[#697386] dark:text-[#9CA3AF] hover:text-[#17181D]'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Preview</span>
          </button>
        </div>

        {/* Action formatting buttons */}
        {activeTab === 'write' && (
          <div className="flex items-center gap-1 text-[#697386]">
            <button
              type="button"
              onClick={() => insertSyntax('**', '**')}
              title="Bold"
              className="p-1.5 hover:bg-[#F0F2F5] dark:hover:bg-[#282C37] rounded-md transition-colors"
            >
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertSyntax('*', '*')}
              title="Italic"
              className="p-1.5 hover:bg-[#F0F2F5] dark:hover:bg-[#282C37] rounded-md transition-colors"
            >
              <Italic className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertSyntax('```typescript\n', '\n```')}
              title="Code Block"
              className="p-1.5 hover:bg-[#F0F2F5] dark:hover:bg-[#282C37] rounded-md transition-colors"
            >
              <Code className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertSyntax('- ')}
              title="Bullet List"
              className="p-1.5 hover:bg-[#F0F2F5] dark:hover:bg-[#282C37] rounded-md transition-colors"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertSyntax('[', '](https://)')}
              title="Link"
              className="p-1.5 hover:bg-[#F0F2F5] dark:hover:bg-[#282C37] rounded-md transition-colors"
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleCopy}
          title="Copy Markdown"
          className="p-1.5 text-[#9CA3AF] hover:text-[#17181D] dark:hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Editor Body */}
      {activeTab === 'write' ? (
        <textarea
          id="markdown-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full p-4 text-xs sm:text-sm font-mono text-[#17181D] dark:text-[#F3F4F6] bg-transparent border-none focus:outline-none resize-y ${minHeight}`}
        />
      ) : (
        <div
          className={`p-4 text-xs sm:text-sm leading-relaxed text-[#17181D] dark:text-[#F3F4F6] overflow-y-auto ${minHeight}`}
          dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
        />
      )}

      {/* Stats footer */}
      <div className="flex items-center justify-between border-t border-[#E5E7EB] dark:border-[#282C37] px-3.5 py-1.5 text-[11px] text-[#9CA3AF] bg-[#FAFBFD] dark:bg-[#1A1D24]">
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
