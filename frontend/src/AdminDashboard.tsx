import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  BarChart3, 
  Trash2, 
  LogOut, 
  Sparkles, 
  RefreshCw, 
  Building2, 
  GraduationCap, 
  Wrench, 
  Trees, 
  Utensils, 
  AlertCircle, 
  X, 
  MessageSquare,
  User,
  Radio
} from "lucide-react";

interface CommentItem {
  id: number;
  role?: string;
  user_role?: string;
  comment_text: string;
  aspect?: string;
  sentiment?: string;
  created_at?: string;
  absa_results?: { aspect: string; sentiment: string }[];
}

interface AdminDashboardProps {
  onLogout?: () => void;
}

const DEMO_COMMENTS: CommentItem[] = [
  { id: 101, role: "Student", comment_text: "ကျောင်းအပ်တဲ့လုပ်ငန်းစဉ်က မြန်ဆန်ပြီး ဝန်ထမ်းတွေက အရမ်းကူညီပေးကြပါတယ်။", aspect: "Administrative", sentiment: "Positive" },
  { id: 102, role: "Parent", comment_text: "ဖောင်တစ်ခု လက်မှတ်ထိုးဖို့အတွက်တင် ၂ နာရီလောက် စောင့်လိုက်ရတယ်။ လုပ်ငန်းကြန့်ကြာနေပါတယ်။", aspect: "Administrative", sentiment: "Negative" },
  { id: 103, role: "Student", comment_text: "ရုံးချိန်ကတော့ ပုံမှန်ပါပဲ၊ ဒါပေမယ့် နေ့လည်စာစားချိန်မှာ ရုံးခန်းပိတ်ထားတတ်တယ်။", aspect: "Administrative", sentiment: "Neutral" },
  { id: 104, role: "Student", comment_text: "ဆရာဦးအောင် သင်ပြတာ အရမ်းရှင်းလင်းပါတယ်။ လက်တွေ့ပိုင်းတွေလည်း အများကြီးလုပ်ရလို့ သဘောကျပါတယ်။", aspect: "Teaching", sentiment: "Positive" },
  { id: 105, role: "Student", comment_text: "ဒီနှစ် သင်ရိုးညွှန်းတမ်းအသစ်က အရင်နှစ်ကထက် အများကြီး ပိုကောင်းလာတယ်။", aspect: "Teaching", sentiment: "Positive" },
  { id: 106, role: "Student", comment_text: "သင်္ချာဆရာက အရမ်းမြန်မြန်သင်တော့ လိုက်မရေးနိုင်ဘူး ဖြစ်နေတယ်။", aspect: "Teaching", sentiment: "Negative" },
  { id: 107, role: "Student", comment_text: "သင်ကြားရေးကတော့ ပုံမှန်ပါပဲ၊ ထူးထူးခြားခြား ဆိုးတာမျိုးတော့ မရှိပါဘူး။", aspect: "Teaching", sentiment: "Neutral" },
  { id: 108, role: "Student", comment_text: "စာကြည့်တိုက်က Wi-Fi လိုင်း အရမ်းနှေးလွန်းလို့ စာလုပ်လို့မရဘူး ဖြစ်နေတယ်။", aspect: "Facilities", sentiment: "Negative" },
  { id: 109, role: "Student", comment_text: "Lab 3 ထဲက ကွန်ပျူတာ တဝက်လောက်က ပျက်နေလို့ သုံးလို့မရပါဘူး။", aspect: "Facilities", sentiment: "Negative" },
  { id: 110, role: "Parent", comment_text: "အားကစားရုံသစ်ကြီးက အရမ်းမိုက်ပါတယ်။ ပစ္စည်းတွေလည်း အစုံအလင်ရှိတယ်။", aspect: "Facilities", sentiment: "Positive" },
  { id: 111, role: "Student", comment_text: "Main Hall က အဲကွန်းတွေ ပြင်ပြီးသွားလို့ အခုဆို အဆင်ပြေသွားပါပြီ။", aspect: "Facilities", sentiment: "Positive" },
  { id: 112, role: "Student", comment_text: "ကျောင်းဝန်းကြီးက သစ်ပင်တွေနဲ့ စိမ်းလန်းနေတော့ ညနေဘက် လမ်းလျှောက်ရတာ စိတ်အေးချမ်းပါတယ်။", aspect: "Environment", sentiment: "Positive" },
  { id: 113, role: "Parent", comment_text: "ကျောင်းဝန်းတစ်ခုလုံး သန့်ရှင်းရေးကို သေသေချာချာ လုပ်ထားတာ တွေ့ရပါတယ်။", aspect: "Environment", sentiment: "Positive" },
  { id: 114, role: "Student", comment_text: "အင်ဂျင်နီယာကျောင်းဆောင်ဘက်မှာ အမှိုက်ပုံးတွေ လုံလုံလောက်လောက် မရှိဘူး ဖြစ်နေတယ်။", aspect: "Environment", sentiment: "Negative" },
  { id: 115, role: "Student", comment_text: "ဒီ Term မှာ ကန်တင်းက အစားအသောက်ဈေးတွေ ထပ်တက်သွားပြန်ပြီ။", aspect: "Canteen", sentiment: "Negative" },
  { id: 116, role: "Student", comment_text: "ဆိုင်အမှတ် (၂) က မုန့်ဟင်းခါးက ကျောင်းမှာ အကောင်းဆုံးပဲ! အရမ်းစားကောင်းတယ်။", aspect: "Canteen", sentiment: "Positive" },
  { id: 117, role: "Student", comment_text: "နေ့လည်စာစားချိန်ဆို လူအရမ်းကျပ်ပြီး ထိုင်စရာခုံ လုံးဝမရှိဘူး။", aspect: "Canteen", sentiment: "Negative" },
  { id: 118, role: "Student", comment_text: "ကန်တင်းက သန့်ရှင်းရေးကို ဒီထက်ပိုပြီး ဂရုစိုက်သင့်ပါတယ်။", aspect: "Canteen", sentiment: "Negative" },
  { id: 119, role: "Staff", comment_text: "ကော်ဖီဆိုင်အသစ်လေးက ကောင်းပါတယ်၊ ဒါပေမယ့် ဈေးနည်းနည်း များနေတယ်။", aspect: "Canteen", sentiment: "Neutral" }
];

const ASPECT_ICONS: Record<string, any> = {
  Administrative: Building2,
  Teaching: GraduationCap,
  Facilities: Wrench,
  Facility: Wrench,
  Environment: Trees,
  Canteen: Utensils,
};

function getCoordinatesForPercent(percent: number) {
  const x = Math.cos(2 * Math.PI * percent);
  const y = Math.sin(2 * Math.PI * percent);
  return [x, y];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [comments, setComments] = useState<CommentItem[]>(DEMO_COMMENTS);
  const [loading, setLoading] = useState<boolean>(false);
  const [password, setPassword] = useState<string>(""); 
  const [loginError, setLoginError] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    localStorage.getItem("admin_authenticated") === "true"
  );

  const [selectedAspect, setSelectedAspect] = useState<string | null>(null);
  const [selectedSentiment, setSelectedSentiment] = useState<"Positive" | "Negative" | "Neutral" | null>(null);

  // Smooth Auto-Looping Feed Motion States
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const adminSecret = "root";

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/admin/comments", {
        headers: { "x-admin-secret": adminSecret },
      });
      if (response.ok) {
        const jsonRes = await response.json();
        const rawList = Array.isArray(jsonRes) ? jsonRes : jsonRes.data;
        if (rawList && rawList.length > 0) {
          setComments(rawList);
        } else {
          setComments(DEMO_COMMENTS);
        }
      }
    } catch (err) {
      console.error("Error connecting to API, using fallback data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchComments();

    const ws = new WebSocket("ws://localhost:8000/ws/dashboard");

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === "new_feedback_received" || msg.event === "new_comment") {
          const newDoc: CommentItem = {
            id: Number(msg.data.id) || Date.now(),
            role: msg.data.user_role || "Student",
            user_role: msg.data.user_role || "Student",
            comment_text: msg.data.comment_text,
            aspect: msg.data.aspect,
            sentiment: msg.data.sentiment,
            created_at: new Date().toISOString()
          };
          
          setComments((prev) => {
            if (prev.some((c) => Number(c.id) === Number(newDoc.id))) {
              return prev;
            }
            return [newDoc, ...prev];
          });
        }
      } catch (e) {
        console.error("Failed to parse websocket message", e);
      }
    };

    return () => {
      ws.close();
    };
  }, [isAuthenticated]);

  // Smooth Loop Animation Tick
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const interval = setInterval(() => {
      if (!isPaused && el) {
        // Continuous upward glide
        el.scrollTop += 0.8;

        // Infinite loop reset when reaching bottom
        if (el.scrollTop >= el.scrollHeight - el.clientHeight - 2) {
          el.scrollTop = 0;
        }
      }
    }, 30);

    return () => clearInterval(interval);
  }, [isPaused, comments]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(""); 
    if (password === adminSecret || password === "admin123") {
      setIsAuthenticated(true);
      localStorage.setItem("admin_authenticated", "true");
    } else {
      setLoginError("စကားဝှက် မှားယွင်းနေပါသည်။ ပြန်လည်ကြိုးစားကြည့်ပါ။");
    }
  };

  const handleLogoutClick = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("admin_authenticated");
    if (onLogout) onLogout();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("ဤမှတ်ချက်ကို ဖျက်ရန် သေချာပါသလား?")) return;
    setComments((prev) => prev.filter((c) => c.id !== id));
    try {
      await fetch(`http://localhost:8000/api/admin/comments/${id}`, {
        method: "DELETE",
        headers: { "x-admin-secret": adminSecret },
      });
    } catch (err) {
      console.error("Failed to delete from DB", err);
    }
  };

  const ASPECT_CONFIGS = [
    { key: "Administrative", label: "Administrative", icon: Building2 },
    { key: "Teaching", label: "Teaching", icon: GraduationCap },
    { key: "Facilities", label: "Facilities", icon: Wrench },
    { key: "Environment", label: "Environment", icon: Trees },
    { key: "Canteen", label: "Canteen", icon: Utensils },
  ];

  const aspectStats = useMemo(() => {
    const stats: Record<string, { positive: number; neutral: number; negative: number; total: number }> = {
      Administrative: { positive: 0, neutral: 0, negative: 0, total: 0 },
      Teaching: { positive: 0, neutral: 0, negative: 0, total: 0 },
      Facilities: { positive: 0, neutral: 0, negative: 0, total: 0 },
      Environment: { positive: 0, neutral: 0, negative: 0, total: 0 },
      Canteen: { positive: 0, neutral: 0, negative: 0, total: 0 },
    };

    comments.forEach((c) => {
      const itemAspect = (c.aspect || (c.absa_results && c.absa_results[0]?.aspect) || "").toLowerCase();
      const itemSentiment = (c.sentiment || (c.absa_results && c.absa_results[0]?.sentiment) || "").toLowerCase();

      ASPECT_CONFIGS.forEach((config) => {
        const targetKey = config.key.toLowerCase().replace(/s$/, "");
        if (itemAspect.includes(targetKey)) {
          stats[config.key].total += 1;
          if (itemSentiment.includes("pos") || itemSentiment.includes("good") || itemSentiment.includes("ကျေနပ်")) {
            stats[config.key].positive += 1;
          } else if (itemSentiment.includes("neg") || itemSentiment.includes("bad") || itemSentiment.includes("လို")) {
            stats[config.key].negative += 1;
          } else {
            stats[config.key].neutral += 1;
          }
        }
      });
    });
    return stats;
  }, [comments]);

  const modalComments = useMemo(() => {
    if (!selectedAspect || !selectedSentiment) return [];
    return comments.filter((c) => {
      const itemAspect = (c.aspect || (c.absa_results && c.absa_results[0]?.aspect) || "").toLowerCase();
      const itemSentiment = (c.sentiment || (c.absa_results && c.absa_results[0]?.sentiment) || "").toLowerCase();
      
      const targetKey = selectedAspect.toLowerCase().replace(/s$/, "");
      const aspectMatch = itemAspect.includes(targetKey);
      
      let sentimentMatch = false;
      if (selectedSentiment === "Positive") {
        sentimentMatch = itemSentiment.includes("pos") || itemSentiment.includes("good");
      } else if (selectedSentiment === "Negative") {
        sentimentMatch = itemSentiment.includes("neg") || itemSentiment.includes("bad");
      } else {
        sentimentMatch = !itemSentiment.includes("pos") && !itemSentiment.includes("good") && !itemSentiment.includes("neg") && !itemSentiment.includes("bad");
      }
      return aspectMatch && sentimentMatch;
    });
  }, [comments, selectedAspect, selectedSentiment]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-['Padauk',sans-serif]">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full border border-slate-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-100 shadow-sm">
              <BarChart3 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Admin Login</h2>
            <p className="text-slate-500 text-xs mt-1">NSPU Guide Analytics Dashboard</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">စကားဝှက် (Password)</label>
              <input
                type="password"
                className={`w-full text-xs px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                  loginError ? "border-rose-500 focus:ring-rose-500/50 bg-rose-50/50" : "border-slate-300 focus:ring-blue-500 bg-slate-50"
                }`}
                placeholder="စကားဝှက် ရိုက်ထည့်ပါ..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginError(""); 
                }}
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-3 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer">
              ဝင်ရောက်မည်
            </button>
            {loginError && (
              <div className="flex items-center justify-center gap-2 text-rose-500 text-xs font-medium pt-2">
                <AlertCircle className="w-4 h-4" />
                <span>{loginError}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-6 font-['Padauk',sans-serif]">
      
      {/* Top Header */}
      <div className="max-w-[1700px] mx-auto mb-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl flex items-center justify-center shadow-sm">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900">NSPU Guide — Analytics & Live Feed</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Real-time Aspect-Based Sentiment Analysis & Streaming Feed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchComments} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> ပြန်လည်စတင်ရန်
          </button>
          <button onClick={handleLogoutClick} className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl text-xs transition-all cursor-pointer">
            <LogOut className="w-3.5 h-3.5" /> ထွက်မည်
          </button>
        </div>
      </div>

      {/* 2-Column Split: Pie Charts vs Live Stream */}
      <div className="max-w-[1700px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Pie Charts (8 cols) */}
        <div className="xl:col-span-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
          <div className="mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" /> ကဏ္ဍအလိုက် သုံးသပ်ချက်များ (Sentiment Analysis)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              အသေးစိတ် မှတ်ချက်များကို ကြည့်ရန် Good, Neutral သို့မဟုတ် Bad ခလုတ်များကို နှိပ်ပါ။
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-2">
            {ASPECT_CONFIGS.map((cfg) => {
              const stat = aspectStats[cfg.key] || { positive: 0, neutral: 0, negative: 0, total: 0 };
              const IconComp = cfg.icon;
              const total = stat.total || 1;

              const posFrac = stat.positive / total;
              const neuFrac = stat.neutral / total;
              const negFrac = stat.negative / total;

              const posPct = Math.round(posFrac * 100);
              const neuPct = Math.round(neuFrac * 100);
              const negPct = Math.round(negFrac * 100);

              let cumulativePercent = 0;

              const getSlice = (fraction: number, color: string, pctString: string) => {
                if (fraction === 0) return null;
                if (fraction === 1) {
                  return (
                    <g key={color}>
                      <circle cx="0" cy="0" r="1" fill={color} />
                      <text x="0" y="0.05" fontSize="0.35" fill="white" textAnchor="middle" fontWeight="bold" dy=".3em">
                        {pctString}%
                      </text>
                    </g>
                  );
                }

                const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                cumulativePercent += fraction;
                const [endX, endY] = getCoordinatesForPercent(cumulativePercent);

                const largeArcFlag = fraction > 0.5 ? 1 : 0;
                const pathData = [
                  `M ${startX} ${startY}`,
                  `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                  `L 0 0`,
                ].join(" ");

                const textPercent = cumulativePercent - (fraction / 2);
                const [textX, textY] = getCoordinatesForPercent(textPercent);

                return (
                  <g key={color}>
                    <path d={pathData} fill={color} />
                    <text 
                      x={textX * 0.65} 
                      y={textY * 0.65} 
                      fontSize="0.26" 
                      fill="white" 
                      textAnchor="middle" 
                      fontWeight="bold" 
                      dy=".3em"
                    >
                      {pctString}%
                    </text>
                  </g>
                );
              };

              return (
                <div key={cfg.key} className="bg-slate-50/80 hover:bg-slate-50 rounded-2xl p-3.5 border border-slate-200 flex flex-col justify-between items-center text-center shadow-xs transition-all">
                  <div className="w-full mb-2 flex flex-col items-center justify-center pb-2 border-b border-slate-200/80 gap-1">
                    <div className="p-2 bg-blue-100/80 text-blue-700 rounded-xl shadow-xs">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">{cfg.label}</span>
                    <span className="text-[10px] bg-white text-slate-600 px-2 py-0.5 rounded-full font-semibold border border-slate-200">
                      စုစုပေါင်း {stat.total}
                    </span>
                  </div>

                  <div className="relative my-2 w-24 h-24 drop-shadow-xs">
                    {stat.total > 0 ? (
                      <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full rounded-full">
                        {getSlice(posFrac, "#10b981", posPct.toString())}
                        {getSlice(neuFrac, "#f59e0b", neuPct.toString())}
                        {getSlice(negFrac, "#f43f5e", negPct.toString())}
                      </svg>
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-200/80 flex items-center justify-center">
                         <span className="text-slate-400 font-medium text-[10px]">မှတ်ချက်မရှိပါ</span>
                      </div>
                    )}
                  </div>

                  <div className="w-full mt-2 space-y-1.5 text-xs">
                    <button 
                      onClick={() => { setSelectedAspect(cfg.key); setSelectedSentiment("Positive"); }}
                      className="w-full flex justify-between items-center bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Good
                      </span>
                      <span className="font-bold text-emerald-900 text-xs">{stat.positive}</span>
                    </button>

                    <button 
                      onClick={() => { setSelectedAspect(cfg.key); setSelectedSentiment("Neutral"); }}
                      className="w-full flex justify-between items-center bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 text-amber-700 font-semibold text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span> Neutral
                      </span>
                      <span className="font-bold text-amber-900 text-xs">{stat.neutral}</span>
                    </button>

                    <button 
                      onClick={() => { setSelectedAspect(cfg.key); setSelectedSentiment("Negative"); }}
                      className="w-full flex justify-between items-center bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 text-rose-700 font-semibold text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span> Bad
                      </span>
                      <span className="font-bold text-rose-900 text-xs">{stat.negative}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Realtime Live Streaming Feed with Smooth Loop Motion */}
        <div className="xl:col-span-4 bg-white text-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between h-[680px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Live Streaming Feed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono">
                {isPaused ? "⏸️ Paused" : "▶️ Auto-Gliding"}
              </span>
              <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                {comments.length} total
              </span>
            </div>
          </div>

          {/* Smooth Auto-Gliding Scroll Container (Pauses on Hover) */}
          <div 
            ref={scrollContainerRef}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="flex-1 overflow-y-auto space-y-3 pr-1.5 transition-all scroll-smooth"
          >
            {comments.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                မှတ်ချက်များ စောင့်ဆိုင်းနေပါသည်...
              </div>
            ) : (
              // Duplicate comments list to guarantee seamless infinite loop gliding
              [...comments, ...comments].map((item, index) => {
                const AspectIcon = item.aspect ? ASPECT_ICONS[item.aspect] || MessageSquare : MessageSquare;
                const isPositive = item.sentiment?.toLowerCase().includes("pos");
                const isNegative = item.sentiment?.toLowerCase().includes("neg");

                return (
                  <div
                    key={`${item.id}-${index}`}
                    className="bg-slate-50/80 border border-slate-200 hover:border-blue-400 hover:bg-white rounded-2xl p-3.5 transition-all duration-300 shadow-xs hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                          <User className="w-3 h-3" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800">{item.user_role || item.role || "Student"}</span>
                          <span className="text-[9px] text-slate-400 block font-mono">#{item.id}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {item.aspect && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white text-slate-700 border border-slate-200 shadow-xs">
                            <AspectIcon className="w-2.5 h-2.5 text-blue-600" />
                            {item.aspect}
                          </span>
                        )}
                        {item.sentiment && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              isPositive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : isNegative
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {item.sentiment}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed pl-8 font-normal">
                      "{item.comment_text}"
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Popup Modal */}
      {selectedAspect && selectedSentiment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
            <div className={`p-6 border-b flex items-center justify-between ${
              selectedSentiment === "Positive" ? "bg-emerald-50/80 border-emerald-100" :
              selectedSentiment === "Negative" ? "bg-rose-50/80 border-rose-100" :
              "bg-amber-50/80 border-amber-100"
            }`}>
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 opacity-70" />
                  {selectedAspect} Feedback
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide ${
                    selectedSentiment === "Positive" ? "bg-emerald-100 text-emerald-800" :
                    selectedSentiment === "Negative" ? "bg-rose-100 text-rose-800" :
                    "bg-amber-100 text-amber-800"
                  }`}>
                    {selectedSentiment}
                  </span>
                  <span className="text-xs font-medium text-slate-600">
                    — မှတ်ချက် {modalComments.length} ခု တွေ့ရှိပါသည်
                  </span>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedAspect(null); setSelectedSentiment(null); }}
                className="p-2 hover:bg-black/5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
              {modalComments.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  ယခု ကဏ္ဍအတွက် {selectedSentiment} မှတ်ချက်များ မရှိသေးပါ။
                </div>
              ) : (
                <div className="space-y-3">
                  {modalComments.map((item) => {
                    const displayRole = item.user_role || item.role || "Student";
                    return (
                      <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex gap-4 group hover:border-blue-200 transition-all">
                        <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs ${
                          displayRole === 'Parent' ? 'bg-purple-100 text-purple-700' : 
                          displayRole === 'Staff' ? 'bg-orange-100 text-orange-700' :
                          displayRole === 'Teacher' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {displayRole.charAt(0)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{displayRole}</span>
                            <span className="text-[10px] font-mono text-slate-400">#{item.id}</span>
                          </div>
                          <p className="text-xs text-slate-800 leading-relaxed font-normal">"{item.comment_text}"</p>
                        </div>

                        <div className="flex flex-col items-end justify-start">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="မှတ်ချက်ကို ဖျက်မည်"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;