'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Terminal, Send, Cpu, User, Copy, Check, Hash, Activity } from 'lucide-react';
import 'highlight.js/styles/github-dark.css';

export default function Home() {
  // --- State Management ---
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- Initial Data Fetching from Local Backend ---
  useEffect(() => {
    const fetchChats = async () => {
      try {
        // Fetching history from our FastAPI storage
        const res = await fetch('http://127.0.0.1:8001/get_chats');
        const data = await res.json();
        if (data.length > 0) {
          setChats(data);
          setActiveChatId(data[0].id);
        }
      } catch (e) {
        console.error("Storage link failed:", e);
      }
    };
    fetchChats();
  }, []);

  // --- Handlers ---
  const sendMessage = async () => {
    if (!input.trim() || !activeChatId || isLoading) return;

    // 1. Prepare UI state
    const userMsg = { role: 'user', text: input };
    const currentChat = chats.find(c => c.id === activeChatId);
    
    const updatedChat = { 
      ...currentChat, 
      messages: [...currentChat.messages, userMsg],
      title: currentChat.title === 'New Call' ? input.substring(0, 20) : currentChat.title 
    };

    setChats(chats.map(c => c.id === activeChatId ? updatedChat : c));
    const promptToSend = input;
    setInput('');
    setIsLoading(true);

    try {
      // 2. Request AI Response from vLLM via Backend
      const res = await fetch('http://127.0.0.1:8001/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToSend })
      });
      const data = await res.json();
      
      const finalChat = { 
        ...updatedChat, 
        messages: [...updatedChat.messages, { role: 'bot', text: data.response || data.error }] 
      };

      // 3. Save state to Physical Storage (backend/data)
      setChats(prev => prev.map(c => c.id === activeChatId ? finalChat : c));
      await fetch('http://127.0.0.1:8001/save_chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalChat)
      });
    } catch (e) {
      console.error("API link failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Reusable Code Block Component ---
  const CodeBlock = ({ children, className }: any) => {
    const [copied, setCopied] = useState(false);
    const language = className?.replace(/^(hljs|language-)/, '') || 'text';
    const content = String(children).replace(/\n$/, '');

    const handleCopy = () => {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="my-4 rounded overflow-hidden border border-zinc-800 bg-black/40">
        <div className="flex items-center justify-between bg-zinc-900/80 px-4 py-2 text-[10px] border-b border-zinc-800 text-zinc-400 font-sans">
          <span className="flex items-center gap-2 tracking-widest"><Hash size={12} /> {language.toUpperCase()}</span>
          <button onClick={handleCopy} className="hover:text-green-500 flex items-center gap-1 transition-colors">
            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'SUCCESS' : 'COPY_RAW'}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-sm leading-relaxed text-zinc-300 font-mono"><code>{children}</code></pre>
      </div>
    );
  };

  // --- Resolve current active chat object [FIXED] ---
  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-300 font-mono overflow-hidden selection:bg-green-900/30">
      <Sidebar 
        chats={chats} 
        activeChatId={activeChatId} 
        onNewChat={() => {
          const newId = Date.now().toString();
          setChats([{ id: newId, title: 'New Call', messages: [] }, ...chats]);
          setActiveChatId(newId);
        }} 
        onSelectChat={setActiveChatId}
        onDeleteChat={(id: string) => setChats(chats.filter(c => c.id !== id))}
      />

      <main className="flex-1 flex flex-col relative bg-black">
        {/* Status Header */}
        <header className="h-14 border-b border-zinc-900 flex justify-between items-center px-6 bg-black/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-4 text-[10px] tracking-widest">
            <span className="flex items-center gap-2 text-green-500 animate-pulse"><Activity size={14}/> SYSTEM_READY</span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-500 uppercase tracking-tighter">Node: Mukaka-Core</span>
          </div>
          <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest opacity-50">
            Kusabot_OS // v1.5.0_PRO
          </div>
        </header>

        {!activeChatId ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20">
            <Terminal size={64} strokeWidth={1} />
            <p className="mt-4 text-xs tracking-[0.5em]">INITIALIZE_SESSION_TO_CONTINUE</p>
          </div>
        ) : (
          <>
            {/* Messages Stream [FIXED Alignment] */}
            <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-12 scrollbar-hide">
              {activeChat?.messages.map((msg: any, i: number) => (
                <div 
                  key={i} 
                  className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-500 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className="max-w-2xl w-full">
                    {/* Header Block */}
                    <div className={`flex items-center justify-between px-4 py-2 border-x border-t rounded-t-lg text-[10px] tracking-widest font-bold ${
                      msg.role === 'user' 
                        ? 'bg-blue-950/30 border-blue-900/40 text-blue-400' 
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
                    }`}>
                      <div className="flex items-center gap-3 font-sans">
                        {msg.role === 'user' ? <User size={14}/> : <Cpu size={14}/>}
                        {msg.role === 'user' ? 'LOCAL_BUFFER_INPUT' : 'NEURAL_PROCESS_OUTPUT'}
                      </div>
                      <button 
                        onClick={() => navigator.clipboard.writeText(msg.text)}
                        className="flex items-center gap-1.5 hover:text-white transition-colors uppercase cursor-pointer"
                      >
                        <Copy size={12}/> Copy_Block
                      </button>
                    </div>

                    {/* Content Block [FIXED Hydration] */}
                    <div className={`p-6 border rounded-b-lg shadow-2xl ${
                      msg.role === 'user' 
                      ? 'bg-blue-950/10 border-blue-900/30 text-blue-50' 
                      : 'bg-zinc-900/10 border-zinc-800 text-zinc-300'
                    }`}>
                      <div className="prose prose-invert max-w-none font-sans">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]} 
                          rehypePlugins={[rehypeHighlight]}
                          components={{ 
                            code: CodeBlock,
                            p: ({ children }) => <div className="mb-4 last:mb-0 leading-relaxed">{children}</div>
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="max-w-4xl mx-auto flex items-center gap-3 text-[10px] text-green-700 font-bold tracking-[0.3em] animate-pulse">
                  <Activity size={14} className="animate-spin" /> RUNNING_NEURAL_COMPUTATION...
                </div>
              )}
            </div>

            {/* Input Component */}
            <div className="p-8 bg-gradient-to-t from-black via-black to-transparent border-t border-zinc-900/50">
              <div className="max-w-4xl mx-auto relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-3 focus-within:border-green-800/50 transition-all shadow-2xl">
                  <span className="text-green-900 px-3 font-bold select-none">{`>`}</span>
                  <input 
                    className="flex-1 bg-transparent border-none outline-none text-zinc-200 text-sm py-2 font-mono placeholder:text-zinc-800"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Enter command for vLLM..."
                  />
                  <button 
                    onClick={sendMessage} 
                    className="px-4 py-2 bg-zinc-900 hover:bg-green-900/20 text-zinc-500 hover:text-green-500 rounded-lg border border-zinc-800 transition-all shadow-inner"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}