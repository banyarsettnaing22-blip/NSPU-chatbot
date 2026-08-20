import React, { useState } from "react";
import { Send, MessageSquare, CheckCircle2 } from "lucide-react";

export default function CommentPage() {
  const [role, setRole] = useState("Student");
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    setSubmittedSuccess(false);

    try {
      const res = await fetch("http://localhost:8000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_role: role,
          comment_text: commentText.trim(),
        }),
      });

      if (res.ok) {
        setCommentText("");
        setSubmittedSuccess(true);
        setTimeout(() => setSubmittedSuccess(false), 4000);
      } else {
        alert("Feedback ပေးပို့ရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။");
      }
    } catch (err) {
      console.error(err);
      alert("Backend Server နှင့် ချိတ်ဆက်၍ မရပါ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 flex items-center justify-center font-['Padauk',sans-serif]">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-8 border border-slate-200 shadow-xl">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-sm">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">NSPU Student Feedback Portal</h1>
            <p className="text-xs text-slate-500">ကျောင်းသား/သူများ၏ သဘောထားနှင့် အကြံပြုချက်များ ပေးပို့ရန်</p>
          </div>
        </div>

        {/* Success Alert */}
        {submittedSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 text-xs shadow-sm animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <span className="font-semibold">သင့်အကြံပြုချက်ကို အောင်မြင်စွာ ပေးပို့ပြီးပါပြီ။ ကျေးဇူးတင်ရှိပါသည်။</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">အသုံးပြုသူ အခန်းကဏ္ဍ (Role)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            >
              <option value="Student">Student (ကျောင်းသား/သူ)</option>
              <option value="Teacher">Teacher (ဆရာ/ဆရာမ)</option>
              <option value="Staff">Staff (ဝန်ထမ်း)</option>
              <option value="Guest">Guest (ဧည့်သည်)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">သင့်အကြံပြုချက် သို့မဟုတ် မှတ်ချက် (Comment)</label>
            <textarea
              rows={8}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="ကျောင်းနှင့်ပတ်သက်သော မည်သည့် အကြံပြုချက် သဘောထားကိုမဆို လွတ်လပ်စွာ ရေးသားပေးပို့နိုင်ပါသည်..."
              className="w-full text-xs font-normal bg-slate-50 border border-slate-300 rounded-2xl p-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !commentText.trim()}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "ပေးပို့နေပါသည်..." : "တိုက်ရိုက်ပေးပို့မည် (Send Feedback)"}
          </button>
        </form>

      </div>
    </div>
  );
}