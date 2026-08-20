import React, { useState } from "react";
import { Building2, GraduationCap, Wrench, Trees, Utensils, Send, CheckCircle2, MessageSquare } from "lucide-react";

interface CategoryState {
  sentiment: "Positive" | "Neutral" | "Negative" | null;
  comment: string;
}

// 💡 key: "Facilities" matches AdminDashboard's exact category key
const CATEGORIES = [
  { key: "Administrative", name: "Administrative", burmese: "စီမံခန့်ခွဲရေး", icon: Building2, color: "text-blue-500 bg-blue-50" },
  { key: "Teaching", name: "Teaching", burmese: "သင်ကြားရေး", icon: GraduationCap, color: "text-indigo-500 bg-indigo-50" },
  { key: "Facilities", name: "Facilities", burmese: "ကျောင်းတွင်းအသုံးအဆောင်", icon: Wrench, color: "text-emerald-500 bg-emerald-50" },
  { key: "Environment", name: "Environment", burmese: "ကျောင်းပတ်ဝန်းကျင်", icon: Trees, color: "text-teal-500 bg-teal-50" },
  { key: "Canteen", name: "Canteen", burmese: "ကျောင်းမုန့်ဈေးတန်း", icon: Utensils, color: "text-amber-500 bg-amber-50" },
];

export default function CommentPage() {
  const [role, setRole] = useState("Student");
  const [categoryData, setCategoryData] = useState<Record<string, CategoryState>>({
    Administrative: { sentiment: null, comment: "" },
    Teaching: { sentiment: null, comment: "" },
    Facilities: { sentiment: null, comment: "" },
    Environment: { sentiment: null, comment: "" },
    Canteen: { sentiment: null, comment: "" },
  });
  const [freeComment, setFreeComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSentimentChange = (catKey: string, sentiment: "Positive" | "Neutral" | "Negative") => {
    setCategoryData((prev) => ({
      ...prev,
      [catKey]: {
        ...prev[catKey],
        sentiment: prev[catKey].sentiment === sentiment ? null : sentiment,
      },
    }));
  };

  const handleCommentChange = (catKey: string, comment: string) => {
    setCategoryData((prev) => ({
      ...prev,
      [catKey]: { ...prev[catKey], comment },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const feedbackPayloads: Array<{
      user_role: string;
      comment_text: string;
      manual_aspect?: string;
      manual_sentiment?: string;
    }> = [];

    // 1. Collect rated category cards
    for (const cat of CATEGORIES) {
      const data = categoryData[cat.key];
      if (data.sentiment || data.comment.trim()) {
        feedbackPayloads.push({
          user_role: role,
          comment_text: data.comment.trim() || `${cat.name} rated as ${data.sentiment}`,
          manual_aspect: cat.key,
          manual_sentiment: data.sentiment || undefined,
        });
      }
    }

    // 2. Collect free random comment box
    if (freeComment.trim()) {
      feedbackPayloads.push({
        user_role: role,
        comment_text: freeComment.trim(),
      });
    }

    if (feedbackPayloads.length === 0) {
      alert("ကျေးဇူးပြု၍ အနည်းဆုံး ကဏ္ဍတစ်ခု သို့မဟုတ် အကြံပြုချက်တစ်ခု ထည့်သွင်းပေးပါ။");
      setIsSubmitting(false);
      return;
    }

    try {
      for (const item of feedbackPayloads) {
        const res = await fetch("http://localhost:8000/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }
      }
      setSubmitted(true);
    } catch (err) {
      console.error("Submission error:", err);
      alert("Feedback ပေးပို့ရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။ Backend Server Run ထားခြင်းရှိမရှိ စစ်ဆေးပါ။");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">ကျေးဇူးတင်ရှိပါသည်!</h2>
          <p className="text-sm text-slate-500 mb-6">သင်၏ အကြံပြုချက်များကို Admin Dashboard သို့ တိုက်ရိုက် ပေးပို့လိုက်ပါပြီ။</p>
          <button
            onClick={() => {
              setSubmitted(false);
              setCategoryData({
                Administrative: { sentiment: null, comment: "" },
                Teaching: { sentiment: null, comment: "" },
                Facilities: { sentiment: null, comment: "" },
                Environment: { sentiment: null, comment: "" },
                Canteen: { sentiment: null, comment: "" },
              });
              setFreeComment("");
            }}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition"
          >
            နောက်ထပ် အကြံပြုချက်ပေးရန်
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <MessageSquare size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">NSPU Student Feedback & Evaluation</h1>
              <p className="text-xs text-slate-500">ကျောင်း၏ ကဏ္ဍအသီးသီးအတွက် အကြံပြုချက်များနှင့် သဘောထားများကို ပေးပို့နိုင်ပါသည်</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-600">အသုံးပြုသူ အခန်းကဏ္ဍ:</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Student">Student (ကျောင်းသား/သူ)</option>
              <option value="Teacher">Teacher (ဆရာ/ဆရာမ)</option>
              <option value="Staff">Staff (ဝန်ထမ်း)</option>
              <option value="Guest">Guest / Visitor</option>
            </select>
          </div>
        </div>

        {/* 5 Categories Grid */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const current = categoryData[cat.key];
              return (
                <div key={cat.key} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${cat.color}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">{cat.name}</h3>
                          <span className="text-[11px] text-slate-400">{cat.burmese}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSentimentChange(cat.key, "Positive")}
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
                            current.sentiment === "Positive"
                              ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                              : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
                          }`}
                        >
                          Good
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSentimentChange(cat.key, "Neutral")}
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
                            current.sentiment === "Neutral"
                              ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                              : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                          }`}
                        >
                          Neutral
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSentimentChange(cat.key, "Negative")}
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
                            current.sentiment === "Negative"
                              ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                              : "bg-white text-slate-600 border-slate-200 hover:border-rose-300"
                          }`}
                        >
                          Bad
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={current.comment}
                      onChange={(e) => handleCommentChange(cat.key, e.target.value)}
                      placeholder={`${cat.name} နှင့် ပတ်သက်သော အကြံပြုချက်ရေးရန်...`}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Free Random Box */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-1">General / Random Feedback Box</h3>
            <p className="text-xs text-slate-400 mb-3">အထက်ပါ ကဏ္ဍများတွင် မပါဝင်သော အထွေထွေ အကြံပြုချက်များကို ဤနေရာတွင် လွတ်လပ်စွာ ရေးသားနိုင်ပါသည်။</p>
            <textarea
              rows={3}
              value={freeComment}
              onChange={(e) => setFreeComment(e.target.value)}
              placeholder="အခြား အကြံပြုချက်များကို ဤနေရာတွင် ရေးသားပါ..."
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-sm hover:shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send size={16} />
            {isSubmitting ? "ပေးပို့နေပါသည်..." : "Submit All Feedback"}
          </button>
        </form>
      </div>
    </div>
  );
}