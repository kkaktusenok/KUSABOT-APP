'use client';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';

export default function Sidebar({ chats, activeChatId, onNewChat, onSelectChat, onDeleteChat }: any) {
  return (
    <div className="w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col h-full font-mono">
      <button 
        onClick={onNewChat}
        className="m-3 flex items-center gap-2 p-3 border border-zinc-800 rounded-md hover:bg-zinc-900 transition-all text-xs text-green-500"
      >
        <Plus size={14} /> NEW_SYSTEM_CALL
      </button>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {chats.map((chat: any) => (
          <div 
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`group flex items-center justify-between p-2 rounded-md cursor-pointer text-xs ${
              activeChatId === chat.id ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-900/50'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <MessageSquare size={12} />
              <span className="truncate">{chat.title || 'Empty Shell'}</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-zinc-900 text-[10px] text-zinc-700">
        LOGGED_AS: MUKAKA_DEV
      </div>
    </div>
  );
}