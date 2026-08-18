import React, { useState, useEffect, useMemo } from "react";
// လိုအပ်သော Icon များကို lucide-react မှ Import ခေါ်ယူခြင်း
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
  MessageSquare
} from "lucide-react";

// Comment တစ်ခုချင်းစီတွင် ပါဝင်မည့် အချက်အလက်များ (Data Types) ကို သတ်မှတ်ခြင်း
interface CommentItem {
  id: number;
  role: string;
  comment_text: string;
  aspect?: string;
  sentiment?: string;
  created_at?: string;
  absa_results?: { aspect: string; sentiment: string }[];
}

interface AdminDashboardProps {
  onLogout?: () => void;
}

// --- FLEXIBLE DEMO DATA (မြန်မာလို ယာယီပြသမည့် ဒေတာများ) ---
const DEMO_COMMENTS: CommentItem[] = [
  // Administrative
  { id: 101, role: "Student", comment_text: "ကျောင်းအပ်တဲ့လုပ်ငန်းစဉ်က မြန်ဆန်ပြီး ဝန်ထမ်းတွေက အရမ်းကူညီပေးကြပါတယ်။", aspect: "Administrative", sentiment: "Positive" },
  { id: 102, role: "Parent", comment_text: "ဖောင်တစ်ခု လက်မှတ်ထိုးဖို့အတွက်တင် ၂ နာရီလောက် စောင့်လိုက်ရတယ်။ လုပ်ငန်းကြန့်ကြာနေပါတယ်။", aspect: "Administrative", sentiment: "Negative" },
  { id: 103, role: "Student", comment_text: "ရုံးချိန်ကတော့ ပုံမှန်ပါပဲ၊ ဒါပေမယ့် နေ့လည်စာစားချိန်မှာ ရုံးခန်းပိတ်ထားတတ်တယ်။", aspect: "Administrative", sentiment: "Neutral" },
  
  // Teaching
  { id: 104, role: "Student", comment_text: "ဆရာဦးအောင် သင်ပြတာ အရမ်းရှင်းလင်းပါတယ်။ လက်တွေ့ပိုင်းတွေလည်း အများကြီးလုပ်ရလို့ သဘောကျပါတယ်။", aspect: "Teaching", sentiment: "Positive" },
  { id: 105, role: "Student", comment_text: "ဒီနှစ် သင်ရိုးညွှန်းတမ်းအသစ်က အရင်နှစ်ကထက် အများကြီး ပိုကောင်းလာတယ်။", aspect: "Teaching", sentiment: "Positive" },
  { id: 106, role: "Student", comment_text: "သင်္ချာဆရာက အရမ်းမြန်မြန်သင်တော့ လိုက်မရေးနိုင်ဘူး ဖြစ်နေတယ်။", aspect: "Teaching", sentiment: "Negative" },
  { id: 107, role: "Student", comment_text: "သင်ကြားရေးကတော့ ပုံမှန်ပါပဲ၊ ထူးထူးခြားခြား ဆိုးတာမျိုးတော့ မရှိပါဘူး။", aspect: "Teaching", sentiment: "Neutral" },
  
  // Facilities
  { id: 108, role: "Student", comment_text: "စာကြည့်တိုက်က Wi-Fi လိုင်း အရမ်းနှေးလွန်းလို့ စာလုပ်လို့မရဘူး ဖြစ်နေတယ်။", aspect: "Facilities", sentiment: "Negative" },
  { id: 109, role: "Student", comment_text: "Lab 3 ထဲက ကွန်ပျူတာ တဝက်လောက်က ပျက်နေလို့ သုံးလို့မရပါဘူး။", aspect: "Facilities", sentiment: "Negative" },
  { id: 110, role: "Parent", comment_text: "အားကစားရုံသစ်ကြီးက အရမ်းမိုက်ပါတယ်။ ပစ္စည်းတွေလည်း အစုံအလင်ရှိတယ်။", aspect: "Facilities", sentiment: "Positive" },
  { id: 111, role: "Student", comment_text: "Main Hall က အဲကွန်းတွေ ပြင်ပြီးသွားလို့ အခုဆို အဆင်ပြေသွားပါပြီ။", aspect: "Facilities", sentiment: "Positive" },
  
  // Environment
  { id: 112, role: "Student", comment_text: "ကျောင်းဝန်းကြီးက သစ်ပင်တွေနဲ့ စိမ်းလန်းနေတော့ ညနေဘက် လမ်းလျှောက်ရတာ စိတ်အေးချမ်းပါတယ်။", aspect: "Environment", sentiment: "Positive" },
  { id: 113, role: "Parent", comment_text: "ကျောင်းဝန်းတစ်ခုလုံး သန့်ရှင်းရေးကို သေသေချာချာ လုပ်ထားတာ တွေ့ရပါတယ်။", aspect: "Environment", sentiment: "Positive" },
  { id: 114, role: "Student", comment_text: "အင်ဂျင်နီယာကျောင်းဆောင်ဘက်မှာ အမှိုက်ပုံးတွေ လုံလုံလောက်လောက် မရှိဘူး ဖြစ်နေတယ်။", aspect: "Environment", sentiment: "Negative" },
  
  // Canteen
  { id: 115, role: "Student", comment_text: "ဒီ Term မှာ ကန်တင်းက အစားအသောက်ဈေးတွေ ထပ်တက်သွားပြန်ပြီ။", aspect: "Canteen", sentiment: "Negative" },
  { id: 116, role: "Student", comment_text: "ဆိုင်အမှတ် (၂) က မုန့်ဟင်းခါးက ကျောင်းမှာ အကောင်းဆုံးပဲ! အရမ်းစားကောင်းတယ်။", aspect: "Canteen", sentiment: "Positive" },
  { id: 117, role: "Student", comment_text: "နေ့လည်စာစားချိန်ဆို လူအရမ်းကျပ်ပြီး ထိုင်စရာခုံ လုံးဝမရှိဘူး။", aspect: "Canteen", sentiment: "Negative" },
  { id: 118, role: "Student", comment_text: "ကန်တင်းက သန့်ရှင်းရေးကို ဒီထက်ပိုပြီး ဂရုစိုက်သင့်ပါတယ်။", aspect: "Canteen", sentiment: "Negative" },
  { id: 119, role: "Staff", comment_text: "ကော်ဖီဆိုင်အသစ်လေးက ကောင်းပါတယ်၊ ဒါပေမယ့် ဈေးနည်းနည်း များနေတယ်။", aspect: "Canteen", sentiment: "Neutral" }
];

// SVG Pie Chart Slice တွက်ချက်ရန် Helper Function
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

  // Popup Modal အတွက် State များ
  const [selectedAspect, setSelectedAspect] = useState<string | null>(null);
  const [selectedSentiment, setSelectedSentiment] = useState<"Positive" | "Negative" | "Neutral" | null>(null);

  const adminSecret = "admin123";

  // Backend မှ Data ဆွဲယူမည့် Function
  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/admin/comments", {
        headers: { "x-admin-secret": adminSecret },
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setComments(data);
        } else {
          // Database ထဲမှာ Data မရှိရင် မြန်မာလို Demo Comments ကိုပဲ ပြမယ်
          setComments(DEMO_COMMENTS); 
        }
      }
    } catch (err) {
      console.error("Error connecting to API, using demo data.");
      setComments(DEMO_COMMENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchComments();
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(""); 
    if (password === adminSecret) {
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

  // Comment ဖျက်ရန် Function
  const handleDelete = async (id: number) => {
    if (!window.confirm("ဤမှတ်ချက်ကို ဖျက်ရန် သေချာပါသလား?")) return;
    setComments((prev) => prev.filter((c) => c.id !== id));
    try {
      await fetch(`http://localhost:8000/api/admin/comments/${id}`, {
        method: "DELETE",
        headers: { "x-admin-secret": adminSecret },
      });
    } catch (err) {
      console.error("Failed to delete from DB");
    }
  };

  const ASPECT_CONFIGS = [
    { key: "Administrative", label: "Administrative", icon: Building2 },
    { key: "Teaching", label: "Teaching", icon: GraduationCap },
    { key: "Facilities", label: "Facilities", icon: Wrench },
    { key: "Environment", label: "Environment", icon: Trees },
    { key: "Canteen", label: "Canteen", icon: Utensils },
  ];

  // Pie Chart Data တွက်ချက်ခြင်း
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
        if (itemAspect.includes(config.key.toLowerCase())) {
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

  // Modal တွင် ပြသမည့် Filter လုပ်ထားသော Comments များ
  const modalComments = useMemo(() => {
    if (!selectedAspect || !selectedSentiment) return [];
    return comments.filter((c) => {
      const itemAspect = (c.aspect || (c.absa_results && c.absa_results[0]?.aspect) || "").toLowerCase();
      const itemSentiment = (c.sentiment || (c.absa_results && c.absa_results[0]?.sentiment) || "").toLowerCase();
      
      const aspectMatch = itemAspect.includes(selectedAspect.toLowerCase());
      
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


  // ==========================================
  // Login Screen
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-slate-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/30">
              <BarChart3 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Admin Login</h2>
            <p className="text-slate-500 text-sm mt-1">NSPU Guide Analytics Dashboard</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">စကားဝှက် (Password)</label>
              <input
                type="password"
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                  loginError ? "border-rose-500 focus:ring-rose-500/50 bg-rose-50/50" : "border-slate-300 focus:ring-blue-500"
                }`}
                placeholder="စကားဝှက် ရိုက်ထည့်ပါ..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginError(""); 
                }}
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-md transition-all">
              ဝင်ရောက်မည်
            </button>
            {loginError && (
              <div className="flex items-center justify-center gap-2 text-rose-500 text-sm font-medium pt-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4" />
                <span>{loginError}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // Main Dashboard
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8">
      
      {/* Top Header */}
      <div className="max-w-[1400px] mx-auto mb-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">NSPU Guide — Analytics Dashboard</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Real-time Aspect-Based Sentiment Analysis (ABSA)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchComments} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> ပြန်လည်စတင်ရန်
          </button>
          <button onClick={handleLogoutClick} className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium rounded-xl text-sm transition-all">
            <LogOut className="w-4 h-4" /> ထွက်မည်
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto">
        
        {/* Aspect Pie Charts Container */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" /> ကဏ္ဍအလိုက် သုံးသပ်ချက်များ (Sentiment Analysis)
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              အသေးစိတ် မှတ်ချက်များကို ဖတ်ရှုရန် အောက်ပါ Good, Neutral သို့မဟုတ် Bad ခလုတ်များကို နှိပ်ပါ။
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {ASPECT_CONFIGS.map((cfg) => {
              const stat = aspectStats[cfg.key] || { positive: 0, neutral: 0, negative: 0, total: 0 };
              const IconComp = cfg.icon;

              const total = stat.total || 1; // Prevent division by zero
              
              // Calculate fractions
              const posFrac = stat.positive / total;
              const neuFrac = stat.neutral / total;
              const negFrac = stat.negative / total;

              // Calculate percentages for display
              const posPct = Math.round(posFrac * 100);
              const neuPct = Math.round(neuFrac * 100);
              const negPct = Math.round(negFrac * 100);

              // SVG Pie chart calculations
              let cumulativePercent = 0;

              const getSlice = (fraction: number, color: string, pctString: string) => {
                if (fraction === 0) return null;
                
                // If the slice takes up 100% of the pie, draw a full circle instead of a path
                if (fraction === 1) {
                  return (
                    <g key={color}>
                      <circle cx="0" cy="0" r="1" fill={color} />
                      <text x="0" y="0.05" fontSize="0.3" fill="white" textAnchor="middle" fontWeight="bold" dy=".3em">
                        {pctString}%
                      </text>
                    </g>
                  );
                }

                const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                cumulativePercent += fraction;
                const [endX, endY] = getCoordinatesForPercent(cumulativePercent);

                const largeArcFlag = fraction > 0.5 ? 1 : 0;
                
                // Create SVG Path for the slice
                const pathData = [
                  `M ${startX} ${startY}`, // Move
                  `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Arc
                  `L 0 0`, // Line to center
                ].join(" ");

                // Calculate center point for text placement
                const textPercent = cumulativePercent - (fraction / 2);
                const [textX, textY] = getCoordinatesForPercent(textPercent);
                const labelX = textX * 0.65;
                const labelY = textY * 0.65;

                return (
                  <g key={color}>
                    <path d={pathData} fill={color} />
                    <text 
                      x={labelX} 
                      y={labelY} 
                      fontSize="0.25" 
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
                <div key={cfg.key} className="bg-white rounded-3xl p-6 border-2 border-slate-100 flex flex-col justify-between items-center text-center hover:border-blue-200 transition-all duration-300 shadow-sm hover:shadow-md">
                  
                  {/* Header */}
                  <div className="w-full mb-6 flex flex-col items-center justify-center pb-4 border-b border-slate-100 gap-2">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><IconComp className="w-6 h-6" /></div>
                    <span className="text-base font-bold text-slate-800">{cfg.label}</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-semibold">စုစုပေါင်း {stat.total} ခု</span>
                  </div>

                  {/* SOLID PIE CHART WITH TEXT OVERLAY */}
                  <div className="relative my-4 w-44 h-44 drop-shadow-md">
                    {stat.total > 0 ? (
                      <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full rounded-full">
                        {getSlice(posFrac, "#10b981", posPct.toString())} {/* Emerald Green for Positive */}
                        {getSlice(neuFrac, "#f59e0b", neuPct.toString())} {/* Amber Yellow for Neutral */}
                        {getSlice(negFrac, "#f43f5e", negPct.toString())} {/* Rose Red for Negative */}
                      </svg>
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center">
                         <span className="text-slate-400 font-bold text-sm">မှတ်ချက်မရှိပါ</span>
                      </div>
                    )}
                  </div>

                  {/* Interactive Legend Buttons (Clickable) */}
                  <div className="w-full mt-6 space-y-2 text-sm">
                    {/* Positive Button */}
                    <button 
                      onClick={() => { setSelectedAspect(cfg.key); setSelectedSentiment("Positive"); }}
                      className="w-full flex justify-between items-center bg-emerald-50/50 hover:bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-100/50 transition-colors cursor-pointer group"
                    >
                      <span className="flex items-center gap-2 text-emerald-700 font-semibold group-hover:text-emerald-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span> Good
                      </span>
                      <span className="font-bold text-emerald-900">{stat.positive}</span>
                    </button>

                    {/* Neutral Button */}
                    <button 
                      onClick={() => { setSelectedAspect(cfg.key); setSelectedSentiment("Neutral"); }}
                      className="w-full flex justify-between items-center bg-amber-50/50 hover:bg-amber-100 px-3 py-2 rounded-xl border border-amber-100/50 transition-colors cursor-pointer group"
                    >
                      <span className="flex items-center gap-2 text-amber-700 font-semibold group-hover:text-amber-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm"></span> Neutral
                      </span>
                      <span className="font-bold text-amber-900">{stat.neutral}</span>
                    </button>

                    {/* Negative Button */}
                    <button 
                      onClick={() => { setSelectedAspect(cfg.key); setSelectedSentiment("Negative"); }}
                      className="w-full flex justify-between items-center bg-rose-50/50 hover:bg-rose-100 px-3 py-2 rounded-xl border border-rose-100/50 transition-colors cursor-pointer group"
                    >
                      <span className="flex items-center gap-2 text-rose-700 font-semibold group-hover:text-rose-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm"></span> Bad
                      </span>
                      <span className="font-bold text-rose-900">{stat.negative}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==========================================
          POPUP MODAL (Click on Legend to view comments)
          ========================================== */}
      {selectedAspect && selectedSentiment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className={`p-6 border-b flex items-center justify-between ${
              selectedSentiment === "Positive" ? "bg-emerald-50/80 border-emerald-100" :
              selectedSentiment === "Negative" ? "bg-rose-50/80 border-rose-100" :
              "bg-amber-50/80 border-amber-100"
            }`}>
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 opacity-70" />
                  {selectedAspect} Feedback
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide ${
                    selectedSentiment === "Positive" ? "bg-emerald-200/50 text-emerald-800" :
                    selectedSentiment === "Negative" ? "bg-rose-200/50 text-rose-800" :
                    "bg-amber-200/50 text-amber-800"
                  }`}>
                    {selectedSentiment}
                  </span>
                  <span className="text-sm font-medium text-slate-500">
                    — မှတ်ချက် {modalComments.length} ခု တွေ့ရှိပါသည်
                  </span>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedAspect(null); setSelectedSentiment(null); }}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            {/* Modal Body (Scrollable List) */}
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
              {modalComments.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-medium">
                  ယခု ကဏ္ဍအတွက် {selectedSentiment} မှတ်ချက်များ မရှိသေးပါ။
                </div>
              ) : (
                <div className="space-y-4">
                  {modalComments.map((item) => (
                    <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex gap-4 group hover:border-slate-300 transition-all">
                      {/* Avatar / Icon */}
                      <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm ${
                        item.role === 'Parent' ? 'bg-purple-100 text-purple-700' : 
                        item.role === 'Staff' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {item.role ? item.role.charAt(0) : 'S'}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.role || "Student"}</span>
                          <span className="text-xs font-mono text-slate-400">#{item.id}</span>
                        </div>
                        <p className="text-slate-800 leading-relaxed font-medium">"{item.comment_text}"</p>
                      </div>

                      {/* Delete Action */}
                      <div className="flex flex-col items-end justify-start">
                         <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                            title="မှတ်ချက်ကို ဖျက်မည်"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                    </div>
                  ))}
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