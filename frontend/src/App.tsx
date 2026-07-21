import { useState, useEffect } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  feedback?: 'like' | 'dislike' | null;
  comment?: string;
}

export default function App() {
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
  
  // 🔑 Login မလိုဘဲ User တစ်ယောက်ချင်းစီကို ခွဲခြားသိရှိနိုင်မည့် Anonymous Session ID
  const [sessionId, setSessionId] = useState<string>('');
  
  // Rate Limiting (Bot Protection)
  const [lastSentTime, setLastSentTime] = useState<number>(0);
  const RATE_LIMIT_MS = 2000; // 2 seconds

  // Comment Modal State
  const [activeFeedbackMsgId, setActiveFeedbackMsgId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const MAX_CHAR_LIMIT = 300;

  // 1. Generate or Retrieve Anonymous User Session ID
  useEffect(() => {
    let existingSession = localStorage.getItem('nspu_session_id');
    if (!existingSession) {
      existingSession = 'user_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem('nspu_session_id', existingSession);
    }
    setSessionId(existingSession);
  }, []);

  // 2. Clear Session / Reset Chat
  const handleResetSession = () => {
    setMessages([
      { 
        id: Date.now().toString(), 
        text: 'မင်္ဂလာပါ! NSPU Guide Chatbot မှ ကြိုဆိုပါတယ်။ စကားဝိုင်းအသစ် စတင်ပါပြီ။', 
        sender: 'bot', 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }
    ]);
    setInput('');
  };

  // 3. Send Message and Log User Question to Backend/Database
  const handleSend = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // Rate Limiting Check
    const now = Date.now();
    if (now - lastSentTime < RATE_LIMIT_MS) {
      alert("ကျေးဇူးပြု၍ ခဏစောင့်ဆိုင်းပြီးမှ ထပ်မံမေးမြန်းပါ။");
      return;
    }
    setLastSentTime(now);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // User Message UI Update
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: trimmedInput,
      sender: 'user',
      timestamp: timeStr
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsLoading(true);

    // 🎯 BACKEND DATABASE သို့ သွားရောက်သိမ်းဆည်းမည့် Payload
    const logPayload = {
      user_id: sessionId,          // ဘယ် User လဲ (Anonymous ID)
      question: trimmedInput,      // ဘာမေးခွန်း မေးတာလဲ
      created_at: new Date().toISOString() // ဘယ်အချိန်မှာ မေးတာလဲ
    };

    // Console ထဲတွင် Payload ကို စစ်ဆေးရန် Log ထုတ်ပြခြင်း
    console.log("💾 Logging User Question to Database Payload:", logPayload);

    // Simulated FastAPI Backend Response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `"${trimmedInput}" အတွက် တိကျသော အချက်အလက်များကို RAG Engine မှ ရှာဖွေပေးနေပါသည်။`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        feedback: null
      };

      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
    }, 1000);
  };

  // Feedback (Like / Dislike)
  const handleFeedback = (msgId: string, type: 'like' | 'dislike') => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === msgId) {
        return { ...msg, feedback: msg.feedback === type ? null : type };
      }
      return msg;
    }));
  };

  // Submit Comment / Report Correct Data
  const handleSubmitComment = (msgId: string) => {
    if (!commentText.trim()) return;
    
    setMessages(prev => prev.map(msg => {
      if (msg.id === msgId) {
        return { ...msg, comment: commentText };
      }
      return msg;
    }));

    console.log(`💬 User (${sessionId}) Feedback on Msg ${msgId}:`, commentText);
    setCommentText('');
    setActiveFeedbackMsgId(null);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      <main className="flex-1 flex flex-col h-full max-w-5xl mx-auto w-full bg-white shadow-sm border-x border-slate-200">
        
        {/* HEADER */}
        <header className="h-16 border-b border-slate-200 flex items-center px-6 justify-between bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-lg text-blue-700">NSPU Guide</h1>
            <span className="text-[11px] bg-blue-100 text-blue-800 font-mono px-2 py-0.5 rounded-full">
              ID: {sessionId.substring(0, 12)}...
            </span>
          </div>
          
          <button 
            type="button" 
            onClick={handleResetSession}
            className="text-xs font-semibold text-slate-600 hover:text-red-600 border border-slate-300 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            🗑️ Clear Chat
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

                {/* COMMENT & FEEDBACK SECTION */}
                {msg.sender === 'bot' && msg.id !== '1' && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => handleFeedback(msg.id, 'like')}
                        className={`p-1 rounded hover:bg-slate-100 cursor-pointer ${msg.feedback === 'like' ? 'text-green-600 font-bold' : ''}`}
                      >
                        👍 Like
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleFeedback(msg.id, 'dislike')}
                        className={`p-1 rounded hover:bg-slate-100 cursor-pointer ${msg.feedback === 'dislike' ? 'text-red-600 font-bold' : ''}`}
                      >
                        👎 Dislike
                      </button>
                    </div>

                    <button 
                      type="button"
                      onClick={() => setActiveFeedbackMsgId(activeFeedbackMsgId === msg.id ? null : msg.id)}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      💬 {msg.comment ? 'Edit Comment' : 'Report / Comment'}
                    </button>
                  </div>
                )}
              </div>

              {msg.comment && (
                <div className="mt-1 text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-md border border-slate-200 max-w-[75%]">
                  <span className="font-semibold text-blue-600">Your Feedback:</span> {msg.comment}
                </div>
              )}

              {activeFeedbackMsgId === msg.id && (
                <div className="mt-2 w-full max-w-[75%] bg-white border border-slate-300 rounded-lg p-3 shadow-md space-y-2">
                  <p className="text-xs font-semibold text-slate-700">အချက်အလက် မှားယွင်းပါက ပြင်ဆင်ရန် အကြောင်းကြားပါ-</p>
                  <textarea 
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Enter correct data feedback or comments..."
                    className="w-full text-xs p-2 border border-slate-200 rounded outline-none focus:border-blue-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      type="button" 
                      onClick={() => setActiveFeedbackMsgId(null)} 
                      className="text-xs px-2 py-1 text-slate-500 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleSubmitComment(msg.id)} 
                      className="text-xs px-3 py-1 bg-blue-600 text-white rounded font-medium cursor-pointer"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              )}

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