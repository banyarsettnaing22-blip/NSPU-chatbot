import { useState } from 'react';

// ၁။ မဖြစ်မနေလိုအပ်သော Interface သတ်မှတ်ချက်
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

// ၂။ Sidebar အတွက် Mock Chat History Data
const chatHistory = [
  "NSPU ကျောင်းဝင်ခွင့် လမ်းညွှန်",
  "ကွန်ပျူတာသိပ္ပံ မေဂျာ အကြောင်း",
  "ပထမနှစ် ကျောင်းလခ ဘယ်လောက်လဲ",
  "အဆောင်လျှောက်ထားခြင်း လုပ်ငန်းစဉ်"
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'မင်္ဂလာပါ! NSPU Guide Chatbot မှ ကြိုဆိုပါတယ်။ ဘာများ ကူညီပေးရမလဲခင်ဗျာ။', sender: 'bot', timestamp: '10:00 AM' }
  ]);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: `"${input}" အတွက် အချက်အလက်များကို ရှာဖွေနေဆဲဖြစ်ပါသည်။ မကြာမီ RAG Pipeline နှင့် ချိတ်ဆက်ပေးပါမည်။`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1000);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* 1. SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between
        transition-transform duration-300 md:relative md:transform-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold tracking-wider text-emerald-400">NSPU Guide</h1>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">✕</button>
          </div>
          <button className="w-full py-2 px-4 mb-4 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20">
            <span>+</span> New Chat
          </button>
          <div className="space-y-1 overflow-y-auto max-h-[60vh]">
            <p className="text-xs font-semibold text-slate-500 uppercase px-2 mb-2">Recent Chats</p>
            {chatHistory.map((chat, idx) => (
              <button key={idx} className="w-full text-left py-2 px-3 rounded-md text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors truncate">
                💬 {chat}
              </button>
            ))}
          </div>
        </div>
        <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          NSPU Guide v1.0.0
        </div>
      </aside>

      {/* Backdrop */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/50 md:hidden" />
      )}

      {/* 2. MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col h-full relative">
        
        {/* Chat Header */}
        <header className="h-16 border-b border-slate-800 flex items-center px-4 justify-between bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-slate-800 rounded-lg">
              ☰
            </button>
            <div>
              <h2 className="font-semibold text-sm md:text-base">NSPU Info Bot</h2>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Online
              </p>
            </div>
          </div>
        </header>

        {/* 3. MESSAGE WINDOW */}
        <section className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-8rem)]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`
                max-w-[75%] rounded-2xl p-3 md:p-4 text-sm md:text-base shadow-md
                ${msg.sender === 'user' 
                  ? 'bg-emerald-600 text-white rounded-br-none bg-gradient-to-br from-emerald-600 to-teal-700' 
                  : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/50'}
              `}>
                <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                <span className="block text-[10px] text-slate-400 text-right mt-1.5 select-none">{msg.timestamp}</span>
              </div>
            </div>
          ))}
        </section>

        {/* 4. CHAT INPUT BOX */}
        <footer className="p-4 bg-gradient-to-t from-slate-950 to-transparent">
          <div className="max-w-4xl mx-auto flex gap-2 items-center bg-slate-900 border border-slate-800 rounded-xl p-2 focus-within:border-emerald-500/50 transition-colors shadow-2xl">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="NSPU ကျောင်းအကြောင်း သိလိုသည်များကို မေးမြန်းပါ..."
              className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-sm md:text-base text-slate-100 placeholder-slate-500"
            />
            <button 
              onClick={handleSend} 
              className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 md:px-4 md:py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center shadow-md"
            >
              🚀 <span className="hidden md:inline ml-1">Send</span>
            </button>
          </div>
        </footer>

      </main>
    </div>
  );
}