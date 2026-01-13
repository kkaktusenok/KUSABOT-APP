'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { 
  Terminal, Send, Cpu, User, Activity, X, 
  Monitor, Copy, Check, Hash, ChevronDown 
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import 'highlight.js/styles/github-dark.css';

// Определяем интерфейсы строго
interface Message { 
  role: 'user' | 'bot'; 
  text: string; 
}

interface Chat { 
  id: string; 
  title: string; 
  messages: Message[]; 
}

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('');

  useEffect(() => {
    fetch('http://127.0.0.1:8001/get_chats')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setChats(data);
      });

    fetch('http://127.0.0.1:8001/models')
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setModels(list);
        if (list.length > 0) setSelectedModel(list[0]);
      })
      .catch(() => setModels([]));
  }, []);

  useEffect(() => {
    if (!showStats) return;
    const interval = setInterval(() => {
      fetch('http://127.0.0.1:8001/system_stats')
        .then(r => r.json())
        .then(d => {
          if (d && d.global) {
            const update = { 
              time: new Date().toLocaleTimeString(), 
              ...d.global, 
              app_cpu: d.app.cpu, 
              app_ram: d.app.ram_gb 
            };
            setHistory(prev => [...prev, update].slice(-30));
          }
        });
    }, 2000);
    return () => clearInterval(interval);
  }, [showStats]);

  const activeChat = Array.isArray(chats) ? chats.find(c => c.id === activeChatId) : null;
  const latest = history[history.length - 1] || { cpu: 0, ram_pct: 0, ram_gb: '0/0', app_cpu: 0, app_ram: '0' };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const tId = activeChatId || Date.now().toString();
    
    if (!activeChatId) {
      setChats(prev => [{ id: tId, title: input.substring(0, 20), messages: [] }, ...prev]);
      setActiveChatId(tId);
    }

    const userMsg: Message = { role: 'user', text: input };
    
    setChats(prev => prev.map(c => 
      c.id === tId ? { ...c, messages: [...c.messages, userMsg] } : c
    ));

    const promptToSend = input;
    setInput(''); 
    setIsLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8001/generate', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToSend, model: selectedModel })
      });
      
      const data = await res.json();
      const botResponseText = String(data.response || "ERROR: SYSTEM_OFFLINE");
      
      // Создаем объект бота с явным указанием типа Message
      const botMsg: Message = { role: 'bot', text: botResponseText };

      setChats(prev => prev.map(c => {
        if (c.id === tId) {
          const updated: Chat = { ...c, messages: [...c.messages, botMsg] };
          fetch('http://127.0.0.1:8001/save_chat', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(updated)
          });
          return updated;
        }
        return c;
      }));
    } catch (error) {
      console.error("Failed to generate:", error);
    } finally { 
      setIsLoading(false); 
    }
  };

  const CodeBlock = ({ children }: any) => {
    const [copied, setCopied] = useState(false);
    const codeString = String(children).replace(/\n$/, '');
    
    return (
      <div className="my-4 rounded-lg overflow-hidden border border-zinc-800 bg-black/40 font-bold">
        <div className="flex items-center justify-between bg-zinc-900/80 px-4 py-2 text-[10px] border-b border-zinc-800 text-zinc-400 font-mono uppercase tracking-widest">
          <span className="flex items-center gap-2"><Hash size={12} /> CODE_SNIPPET</span>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(codeString); 
              setCopied(true); 
              setTimeout(() => setCopied(false), 2000);
            }} 
            className="hover:text-green-500 flex items-center gap-1 transition-colors uppercase"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'DONE' : 'COPY'}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-sm text-zinc-300 font-mono font-bold">
          <code>{children}</code>
        </pre>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-300 font-mono overflow-hidden selection:bg-green-900/30 font-bold">
      <Sidebar 
        chats={chats} 
        activeChatId={activeChatId} 
        onNewChat={() => setActiveChatId(null)} 
        onSelectChat={setActiveChatId} 
        onDeleteChat={async (id) => { 
          await fetch(`http://127.0.0.1:8001/delete_chat/${id}`, { method: 'DELETE' });
          setChats(prev => prev.filter(c => c.id !== id));
          if (activeChatId === id) setActiveChatId(null);
        }} 
      />

      <main className="flex-1 flex flex-col relative bg-black shadow-2xl">
        <header className="h-14 border-b border-zinc-900 flex justify-between items-center px-6 bg-black/50 backdrop-blur-md z-10">
          <div className="flex-1 text-green-500 font-bold text-[10px] tracking-[0.3em] uppercase flex items-center gap-2">
            <Activity size={14} className="animate-pulse" /> Telemetry_V3.1_LITE
          </div>

          <div className="flex-1 flex justify-center">
            <div className="relative group">
              <div className="flex items-center gap-3 px-4 py-1.5 bg-zinc-900/40 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-all">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                <span className="text-[11px] font-black text-zinc-200 uppercase truncate max-w-[200px]">{selectedModel || 'STANDBY'}</span>
                <ChevronDown size={12} className="text-zinc-500" />
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[280px] bg-zinc-950 border border-zinc-800 rounded-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-2xl overflow-hidden">
                {Array.isArray(models) && models.map((m) => (
                  <div key={m} onClick={() => setSelectedModel(m)} className={`px-4 py-2 text-[10px] uppercase font-bold cursor-pointer transition-colors ${selectedModel === m ? 'text-green-500 bg-green-500/5' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}>{m}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 flex justify-end">
            <button onClick={() => setShowStats(true)} className="text-[10px] border border-zinc-800 px-4 py-2 rounded bg-zinc-950 text-zinc-500 hover:text-white uppercase transition-all flex items-center gap-2 font-bold"><Cpu size={14} /> MONITOR</button>
          </div>
        </header>

        {showStats && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl p-8 relative shadow-2xl flex flex-col font-bold">
              <button onClick={() => setShowStats(false)} className="absolute top-6 right-6 text-zinc-600 hover:text-red-500 transition-colors"><X size={20}/></button>
              <h2 className="text-[10px] tracking-[0.5em] font-black mb-10 text-zinc-500 flex items-center gap-2 uppercase">
                <Monitor size={14} /> Global_Performance_Stats
              </h2>
              <div className="h-64 w-full mb-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <XAxis dataKey="time" hide /><YAxis hide domain={[0, 100]} />
                    <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', fontSize: '10px'}} />
                    <Line type="monotone" dataKey="cpu" stroke="#3b82f6" dot={false} strokeWidth={2} name="CPU %" />
                    <Line type="monotone" dataKey="ram_pct" stroke="#a855f7" dot={false} strokeWidth={2} name="RAM %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-6 font-black uppercase tracking-tighter">
                <div className="group relative p-6 border border-zinc-900 rounded-xl bg-black/40 hover:border-blue-900/50 transition-all text-center">
                  <div className="text-[9px] text-zinc-600 mb-2">CPU_LOAD</div>
                  <div className="text-3xl text-blue-500">{latest.cpu}%</div>
                  <div className="absolute inset-0 bg-blue-950 rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity border border-blue-500 p-2 font-black">
                    <span className="text-[8px] mb-1">Application</span>
                    <span className="text-lg">{latest.app_cpu}%</span>
                  </div>
                </div>
                <div className="group relative p-6 border border-zinc-900 rounded-xl bg-black/40 hover:border-purple-900/50 transition-all text-center">
                  <div className="text-[9px] text-zinc-600 mb-2">RAM_USAGE</div>
                  <div className="text-3xl text-purple-500">{latest.ram_gb}</div>
                  <div className="absolute inset-0 bg-purple-950 rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity border border-purple-500 p-2 font-black">
                    <span className="text-[8px] mb-1">Instance</span>
                    <span className="text-lg">{latest.app_ram}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
          {activeChat ? (
            activeChat.messages.map((m, i) => (
              <div key={i} className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-500 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-2xl w-full border border-zinc-800 rounded-2xl bg-zinc-950/30 shadow-2xl overflow-hidden ${m.role === 'user' ? 'border-blue-900/20' : ''}`}>
                  <div className={`px-4 py-2 border-b border-zinc-800 text-[10px] text-zinc-500 flex justify-between uppercase tracking-[0.2em] font-bold ${m.role === 'user' ? 'bg-blue-900/10' : 'bg-zinc-900/50'}`}>
                    <span className="flex items-center gap-2 font-black tracking-widest">{m.role === 'user' ? <User size={12} /> : <Cpu size={12} />} {m.role}_NODE</span>
                    <button onClick={() => navigator.clipboard.writeText(m.text)} className="hover:text-white transition-colors flex items-center gap-1 font-bold uppercase"><Copy size={12} /> Copy_Msg</button>
                  </div>
                  <div className="p-6 prose prose-invert max-w-none text-zinc-200 font-sans font-bold leading-relaxed">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]} 
                      rehypePlugins={[rehypeHighlight]}
                      components={{ 
                        code: CodeBlock,
                        p: ({children}) => <div className="mb-4 last:mb-0">{children}</div> 
                      }}
                    >
                      {m.text}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-10 uppercase tracking-[1em] text-[10px] font-black">
              <Terminal size={64} className="mb-6" /> System_Standby
            </div>
          )}
          {isLoading && <div className="ml-10 text-[10px] text-green-800 animate-pulse uppercase font-bold tracking-widest flex items-center gap-2"><Activity size={12} className="animate-spin" /> Processing...</div>}
        </div>

        <div className="p-8 bg-black/80 backdrop-blur-xl border-t border-zinc-900">
          <div className="max-w-4xl mx-auto flex items-center bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-2xl focus-within:border-green-900/30 transition-all">
            <span className="text-green-900 px-4 font-black select-none font-bold">❯</span>
            <input className="flex-1 bg-transparent border-none outline-none text-zinc-200 text-sm font-bold font-mono" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Send core instruction..." />
            <button onClick={sendMessage} className="p-2 text-zinc-600 hover:text-green-500 transition-colors"><Send size={20} /></button>
          </div>
        </div>
      </main>
    </div>
  );
}