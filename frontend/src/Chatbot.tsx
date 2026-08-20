import { useState, useEffect } from 'react';
import { MessageSquarePlus } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

// 🇲🇲 မြန်မာ Unicode စာလုံးအစီအစဉ် မှားယွင်းမှုများကို အလိုအလျောက် ပြန်လည်ပြုပြင်ပေးသည့် Function
const fixMyanmarUnicode = (text: string): string => {
  if (!text) return '';
  return text
    .normalize('NFC')
    .replace(/\u1037\u1031/g, '\u1031\u1037')
    .replace(/\u1031\u1031/g, '\u1031')
    .replace(/\u1036\u1037/g, '\u1037\u1036');
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      text: 'မင်္ဂလာပါ! NSPU Guide Chatbot မှ ကြိုဆိုပါတယ်။ ဘာများ ကူညီပေးရမလဲခင်ဗျာ။', 
      sender: 'bot', 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  
  // Rate Limiting (Bot Protection)
  const [lastSentTime, setLastSentTime] = useState<number>(0);
  const RATE_LIMIT_MS = 2000;
  const MAX_CHAR_LIMIT = 300;

  useEffect(() => {
    let existingSession = localStorage.getItem('nspu_session_id');
    if (!existingSession) {
      existingSession = 'user_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem('nspu_session_id', existingSession);
    }
    setSessionId(existingSession);
  }, []);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const now = Date.now();
    if (now - lastSentTime < RATE_LIMIT_MS) {
      alert("ကျေးဇူးပြု၍ ခဏစောင့်ဆိုင်းပြီးမှ ထပ်မံမေးမြန်းပါ။");
      return;
    }
    setLastSentTime(now);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: trimmedInput,
      sender: 'user',
      timestamp: timeStr
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/api/ask?question=${encodeURIComponent(trimmedInput)}`);
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const data = await response.json();

      const rawText = data.answer || data.response || "အချက်အလက် ရှာမတွေ့ပါခင်ဗျာ။";
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: fixMyanmarUnicode(rawText),
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error("Backend Connection Error:", error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "❌ Backend Server (http://localhost:8000) ထံ ချိတ်ဆက်၍ မရပါ သို့မဟုတ် Error ဖြစ်ပေါ်နေပါသည်။",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-['Padauk',sans-serif] overflow-hidden">
      <main className="flex-1 flex flex-col h-full max-w-5xl mx-auto w-full bg-white shadow-sm border-x border-slate-200">
        
        {/* 🌟 HEADER */}
        <header className="h-16 border-b border-slate-200 flex items-center px-6 justify-between bg-white/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <img 
              src="/NSPU.png" 
              alt="NSPU Logo" 
              className="h-10 w-auto object-contain drop-shadow-sm" 
            />
            <div>
              <h1 className="font-bold text-base md:text-lg text-blue-700 leading-none">NSPU Guide</h1>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5 hidden sm:block">
                Naypyitaw State Polytechnic University
              </p>
            </div>
          </div>
          
          {/* အကြံပြုချက် ပေးပို့ရန် New Tab Navigation Button */}
          <button 
            type="button" 
            onClick={() => window.open('/feedback', '_blank')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4 text-blue-600" />
            <span>အကြံပြုချက် ပေးပို့ရန်</span>
          </button>
        </header>

        {/* MESSAGE WINDOW */}
        <section className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gradient-to-b from-blue-50/20 to-white">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`
                max-w-[85%] md:max-w-[75%] rounded-2xl p-4 text-sm md:text-base shadow-sm relative
                ${msg.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'}
              `}>
                <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                <span className={`block text-[10px] text-right mt-2 ${msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl p-3 text-slate-500 text-xs flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                Processing request...
              </div>
            </div>
          )}
        </section>

        {/* INPUT AREA */}
        <footer className="p-4 bg-white border-t border-slate-200">
          <div className="max-w-4xl mx-auto space-y-1">
            <div className="flex justify-between items-center text-[11px] text-slate-400 px-1">
              <span>Question Analytics Enabled</span>
              <span className={input.length > MAX_CHAR_LIMIT ? 'text-red-500 font-bold' : ''}>
                {input.length} / {MAX_CHAR_LIMIT} characters
              </span>
            </div>

            <div className="flex gap-2 items-center bg-slate-50 border border-slate-300 rounded-xl p-2 focus-within:border-blue-500 focus-within:bg-white transition-all shadow-inner">
              <input
                type="text"
                value={input}
                maxLength={MAX_CHAR_LIMIT}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="NSPU ကျောင်းအကြောင်း သိလိုသည်များကို မေးမြန်းပါ..."
                className="flex-1 bg-transparent border-none outline-none px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400"
              />
              <button 
                type="button" 
                onClick={handleSend} 
                disabled={isLoading || !input.trim() || input.length > MAX_CHAR_LIMIT}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
              >
                Send 🚀
              </button>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}