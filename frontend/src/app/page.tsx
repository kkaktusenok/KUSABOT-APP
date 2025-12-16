'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Terminal, Send } from 'lucide-react';
import 'highlight.js/styles/github-dark.css';

export default function Home() {
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Загрузка из localStorage при старте
  useEffect(() => {
    const saved = localStorage.getItem('kusabot_chats');
    if (saved) {
      const parsed = JSON.parse(saved);
      setChats(parsed);
      if (parsed.length > 0) setActiveChatId(parsed[0].id);
    }
  }, []);

  // Сохранение при каждом изменении chats
  useEffect(() => {
    localStorage.setItem('kusabot_chats', JSON.stringify(chats));
  }, [chats]);

  const createNewChat = () => {
    const newId = Date.now().toString();
    const newChat = { id: newId, title: '', messages: [] };
    setChats([newChat, ...chats]);
    setActiveChatId(newId);
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  const sendMessage = async () => {
    if (!input.trim() || !activeChatId || isLoading) return;

    const userMsg = { role: 'user', text: input };
    const updatedChats = chats.map(chat => {
      if (chat.id === activeChatId) {
        return { 
          ...chat, 
          messages: [...chat.messages, userMsg],
          title: chat.title || input.substring(0, 20) 
        };
      }
      return chat;
    });
    setChats(updatedChats);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8001/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      });
      const data = await res.json();
      
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return { ...chat, messages: [...chat.messages, { role: 'bot', text: data.response || data.error }] };
        }
        return chat;
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden font-mono">
      <Sidebar 
        chats={chats} 
        activeChatId={activeChatId} 
        onNewChat={createNewChat} 
        onSelectChat={setActiveChatId}
        onDeleteChat={(id: string) => setChats(chats.filter(c => c.id !== id))}
      />

      <main className="flex-1 flex flex-col relative">
        {!activeChatId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-800">
            <Terminal size={48} className="mb-4 opacity-20" />
            <p className="text-xs tracking-[0.2em]">INITIALIZE_SESSION_TO_START</p>
            <button onClick={createNewChat} className="mt-4 text-green-600 border border-green-900/30 px-6 py-2 hover:bg-green-900/10 transition-all">
              {`> START_NEW_CORE`}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-hide">
              {activeChat?.messages.map((msg: any, i: number) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded border ${
                    msg.role === 'user' ? 'bg-blue-950/5 border-blue-900/20 text-blue-200' : 'bg-zinc-900/20 border-zinc-800 text-zinc-300'
                  }`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              {isLoading && <div className="text-green-800 animate-pulse text-[10px]">EXECUTING_NEURAL_LOGIC...</div>}
            </div>

            <div className="p-4 bg-gradient-to-t from-black via-black to-transparent">
              <div className="max-w-3xl mx-auto relative flex items-center bg-zinc-900/50 border border-zinc-800 rounded-lg p-2">
                <input 
                  className="flex-1 bg-transparent border-none outline-none p-2 text-zinc-300 text-sm"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask KUSABOT..."
                />
                <button onClick={sendMessage} className="p-2 text-green-600 hover:text-green-400">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}