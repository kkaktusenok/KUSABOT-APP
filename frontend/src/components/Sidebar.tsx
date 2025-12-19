'use client';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';

interface SidebarProps {
  chats: any[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => Promise<void>;
}

export default function Sidebar({ chats, activeChatId, onNewChat, onSelectChat, onDeleteChat }: SidebarProps) {
  return (
    <div className="w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col h-full font-mono text-xs font-bold">
      <button onClick={onNewChat} className="m-4 flex items-center gap-2 p-3 border border-zinc-800 rounded bg-zinc-900/20 hover:bg-zinc-900 transition-all text-green-500 font-bold uppercase tracking-tighter">
        <Plus size={14} /> New_Session_Init
      </button>
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
        {Array.isArray(chats) && chats.map((chat) => (
          <div key={chat.id} onClick={() => onSelectChat(chat.id)} className={`group flex items-center justify-between p-2.5 rounded cursor-pointer transition-all uppercase tracking-tighter ${activeChatId === chat.id ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-600 hover:bg-zinc-900/30'}`}>
            <div className="flex items-center gap-2 truncate text-[11px]">
              <MessageSquare size={12} className={activeChatId === chat.id ? 'text-green-500' : ''} />
              <span className="truncate">{chat.title || 'NULL_SESSION'}</span>
            </div>
            <button onClick={async (e) => { e.stopPropagation(); await onDeleteChat(chat.id); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-zinc-900 text-[9px] text-zinc-700 tracking-[0.2em] uppercase font-bold">Node: Mukaka_Dev</div>
    </div>
  );
}