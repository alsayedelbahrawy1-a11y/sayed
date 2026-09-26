import React, { useState, useMemo } from 'react';
import { Card } from '../types';
import { X, Tag as TagIcon, Edit2, Trash2, Check, Filter } from 'lucide-react';

interface TagManagerModalProps {
  cards: Card[];
  isOpen: boolean;
  onClose: () => void;
  onRenameTag: (oldTag: string, newTag: string) => Promise<void>;
  onDeleteTag: (tag: string) => Promise<void>;
  onFilterByTag: (tag: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const TagManagerModal: React.FC<TagManagerModalProps> = ({
  cards,
  isOpen,
  onClose,
  onRenameTag,
  onDeleteTag,
  onFilterByTag,
  onShowToast,
}) => {
  if (!isOpen) return null;

  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');

  // Calculate tag stats
  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    cards.forEach((c) => {
      c.tags?.forEach((t) => {
        map.set(t, (map.get(t) || 0) + 1);
      });
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [cards]);

  const handleStartEdit = (tag: string) => {
    setEditingTag(tag);
    setNewTagName(tag);
  };

  const handleSaveRename = async () => {
    if (!editingTag || !newTagName.trim()) return;
    const cleanNew = newTagName.replace(/^#/, '').trim();
    if (cleanNew !== editingTag) {
      await onRenameTag(editingTag, cleanNew);
      onShowToast(`Renamed #${editingTag} to #${cleanNew}`, 'success');
    }
    setEditingTag(null);
  };

  const handleDelete = async (tag: string) => {
    if (confirm(`Remove tag #${tag} from all cards?`)) {
      await onDeleteTag(tag);
      onShowToast(`Removed tag #${tag}`, 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Manage Tags ({tagCounts.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {tagCounts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No tags found. Add tags to your cards to organize them.
            </div>
          ) : (
            <div className="space-y-2">
              {tagCounts.map(([tag, count]) => (
                <div
                  key={tag}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80 text-xs"
                >
                  {editingTag === tag ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        className="flex-1 h-8 px-2 text-xs bg-white dark:bg-slate-900 border border-indigo-500 rounded-lg focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename();
                          if (e.key === 'Escape') setEditingTag(null);
                        }}
                      />
                      <button
                        onClick={handleSaveRename}
                        className="p-1.5 rounded-lg bg-indigo-600 text-white"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        #{tag}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {count} {count === 1 ? 'card' : 'cards'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        onFilterByTag(tag);
                        onClose();
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                      title="Filter in browser"
                    >
                      <Filter className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleStartEdit(tag)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                      title="Rename tag"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(tag)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Delete tag from cards"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
