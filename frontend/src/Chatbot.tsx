import { useState, useEffect } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  feedback?: 'like' | 'dislike' | null;
  comment?: string;
}

// 🇲🇲 မြန်မာ Unicode စာလုံးအစီအစဉ် မှားယွင်းမှုများကို အလိုအလျောက် ပြန်လည်ပြုပြင်ပေးသည့် Function
const fixMyanmarUnicode = (text: string): string => {
  if (!text) return '';
  return text
    .normalize('NFC')
    // သရတွဲ နှင့် အောက်ကမြစ် အစီအစဉ်များ ပြန်လည်ပြင်ဆင်ခြင်း
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
  const handleSend = async () => {
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

    console.log("💾 Logging User Question to Database Payload:", logPayload);

    try {
      const response = await fetch(`http://localhost:8000/api/ask?question=${encodeURIComponent(trimmedInput)}`);
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const data = await response.json();

      // 💡 fixMyanmarUnicode Function ဖြင့် စာလုံးစစ်ဆေးပြင်ဆင်ပြီးမှ Bot Message ကို ထည့်သွင်းပေးပါသည်
      const rawText = data.answer || data.response || "အချက်အလက် ရှာမတွေ့ပါခင်ဗျာ။";
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: fixMyanmarUnicode(rawText),
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        feedback: null
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

  // Feedback (Like / Dislike)
  const handleFeedback = (msgId: string, type: 'like' | 'dislike') => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === msgId) {
        return { ...msg, feedback: msg.feedback === type ? null : type };
      }
      return msg;
    }));
  };

  // Submit Comment / Report Correct Data to Backend Database
  const handleSubmitComment = async (msgId: string) => {
    if (!commentText.trim()) return;

    // 1. UI အရင် Update လုပ်မည်
    setMessages(prev => prev.map(msg => {
      if (msg.id === msgId) {
        return { ...msg, comment: commentText };
      }
      return msg;
    }));

    // 2. 🎯 Backend Database သို့ Feedback စာသား လှမ်းပို့ခြင်း
    try {
      const response = await fetch('http://localhost:8000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_role: 'Student', 
          comment_text: commentText
        }),
      });

      if (response.ok) {
        console.log("✅ Feedback saved to database successfully!");
      } else {
        console.error("❌ Failed to save feedback to database");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }

    // 3. Modal ပိတ်ပြီး Textbox ရှင်းမည်
    setCommentText('');
    setActiveFeedbackMsgId(null);
  };

  return (
    // 🎨 font-['Padauk',sans-serif] ဖြင့် မြန်မာစာလုံးဒီဇိုင်း တိကျသပ်ရပ်အောင် ပြင်ဆင်ထားပါသည်
    <div className="flex h-screen bg-slate-50 text-slate-800 font-['Padauk',sans-serif] overflow-hidden">
      
      <main className="flex-1 flex flex-col h-full max-w-5xl mx-auto w-full bg-white shadow-sm border-x border-slate-200">
        
        {/* 🌟 HEADER (Top-Left Logo + App Title) */}
        <header className="h-16 border-b border-slate-200 flex items-center px-6 justify-between bg-white/90 backdrop-blur-md">
          {/* ဘယ်ဘက်ထောင့် Logo နှင့် ခေါင်းစဉ် */}
          <div className="flex items-center gap-3">
            <img 
              src="/NSPU.png" 
              alt="NSPU Logo" 
              className="h-10 w-auto object-contain drop-shadow-sm" 
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base md:text-lg text-blue-700 leading-none">NSPU Guide</h1>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-mono px-2 py-0.5 rounded-full font-medium">
                  ID: {sessionId.substring(0, 10)}...
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5 hidden sm:block">
                Naypyitaw State Polytechnic University
              </p>
            </div>
          </div>
          
          {/* ညာဘက်ထောင့် Clear Chat ခလုတ် */}
          <button 
            type="button" 
            onClick={handleResetSession}
            className="text-xs font-semibold text-slate-600 hover:text-red-600 border border-slate-300 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 bg-slate-50 hover:bg-red-50"
          >
            <span>🗑️</span>
            <span>Clear Chat</span>
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