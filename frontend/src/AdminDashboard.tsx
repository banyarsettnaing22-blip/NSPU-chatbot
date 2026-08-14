import React, { useState, useEffect, useMemo } from 'react';

interface CommentData {
  id: number;
  user_role: string;
  comment_text: string;
  created_at: string;
  aspect: string;
  sentiment: string;
}

export const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [comments, setComments] = useState<CommentData[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [filterSentiment, setFilterSentiment] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 1. Password Login စစ်ဆေးခြင်း
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    try {
      const res = await fetch('http://localhost:8000/api/admin/comments', {
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-secret': passwordInput 
        }
      });

      if (res.ok) {
        const json = await res.json();
        setComments(json.data || []);
        setAdminSecret(passwordInput);
        setIsAuthenticated(true);
      } else if (res.status === 401) {
        setErrorMsg('Password မှားယွင်းနေပါသည်။ Admin သာ ဝင်ရောက်နိုင်ပါသည်။');
      } else {
        setErrorMsg(`Server Error: Status ${res.status}`);
      }
    } catch (err) {
      setErrorMsg('Backend Server သို့ ချိတ်ဆက်၍ မရပါ။ Backend (`uvicorn`) Run ထားခြင်း ရှိမရှိ စစ်ဆေးပါ။');
    }
  };

  // 2. Real-time WebSocket စောင့်ကြည့်ခြင်း
  useEffect(() => {
    if (!isAuthenticated) return;

    const ws = new WebSocket('ws://localhost:8000/ws/dashboard');
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'new_feedback_received') {
          setComments((prev) => [payload.data, ...prev]);
        }
      } catch (err) {
        console.error("WebSocket message parsing error:", err);
      }
    };

    return () => ws.close();
  }, [isAuthenticated]);

  // 3. Comment ဖျက်ခြင်း
  const handleDelete = async (id: number) => {
    if (!window.confirm("ဒီ Feedback ကို အပြီးတိုင် ဖျက်ထုတ်မှာ သေချာပါသလား?")) return;

    try {
      const res = await fetch(`http://localhost:8000/api/admin/comments/${id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret 
        }
      });
      if (res.ok) {
        setComments((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert("ဖျက်ထုတ်၍ မရပါ။");
      }
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  // --- Graph & Sentiment Analytics တွက်ချက်မှုများ ---
  const stats = useMemo(() => {
    const total = comments.length;
    const positive = comments.filter((c) => c.sentiment?.toLowerCase() === 'positive').length;
    const negative = comments.filter((c) => c.sentiment?.toLowerCase() === 'negative').length;
    const neutral = comments.filter((c) => c.sentiment?.toLowerCase() === 'neutral').length;

    const posPercent = total > 0 ? Math.round((positive / total) * 100) : 0;
    const negPercent = total > 0 ? Math.round((negative / total) * 100) : 0;
    const neuPercent = total > 0 ? Math.round((neutral / total) * 100) : 0;

    return { total, positive, negative, neutral, posPercent, negPercent, neuPercent };
  }, [comments]);

  // Filter & Search
  const filteredComments = useMemo(() => {
    return comments.filter((item) => {
      const matchesSentiment = filterSentiment === 'All' || item.sentiment?.toLowerCase() === filterSentiment.toLowerCase();
      const matchesSearch = item.comment_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.aspect && item.aspect.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (item.user_role && item.user_role.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSentiment && matchesSearch;
    });
  }, [comments, filterSentiment, searchTerm]);

  // ==================== LOGIN SCREEN ====================
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#eaf4ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Roboto, sans-serif"
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          padding: '40px 48px',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(29, 78, 216, 0.08)',
          width: '100%',
          maxWidth: '420px',
          textAlign: 'center',
          border: '1px solid #d0e4ff'
        }}>
          {/* Login Logo */}
          <div style={{ marginBottom: '16px' }}>
            <img 
              src="/NSPU.png" 
              alt="NSPU Logo" 
              style={{ height: '70px', width: 'auto', objectFit: 'contain' }} 
            />
          </div>
          <h2 style={{ color: '#0f4c81', margin: '0 0 8px 0', fontSize: '22px' }}>NSPU Admin Access</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
            ကျောင်းသား Feedback နှင့် Analysis ရလဒ်များ ကြည့်ရန် Password ရိုက်ထည့်ပါ
          </p>

          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              placeholder="Admin Password ရိုက်ပါ" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
                borderRadius: '8px',
                border: '1.5px solid #bcd7f5',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '16px'
              }}
            />
            <button 
              type="submit" 
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                fontWeight: '600',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}
            >
              Login ဝင်မည်
            </button>
          </form>
          {errorMsg && (
            <div style={{
              marginTop: '16px',
              padding: '10px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              borderRadius: '6px',
              fontSize: '13px'
            }}>
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================== DASHBOARD SCREEN ====================
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f1f7fd',
      fontFamily: "'Segoe UI', Roboto, sans-serif",
      padding: '24px 36px',
      color: '#1e293b'
    }}>
      {/* Top Header Navbar */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '14px 28px',
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(15, 76, 129, 0.05)',
        border: '1px solid #dcebfa',
        marginBottom: '24px'
      }}>
        {/* 🌟 ဘယ်ဘက်ထောင့် Logo နှင့် Header ခေါင်းစဉ် */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img 
            src="/NSPU.png" 
            alt="NSPU Logo" 
            style={{ 
              height: '48px', 
              width: 'auto', 
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))' 
            }} 
          />
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', color: '#0f4c81', fontWeight: '700' }}>
              NSPU Guide — Analytics & Feedback Dashboard
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Real-time Aspect-Based Sentiment Analysis (ABSA)
            </p>
          </div>
        </div>

        {/* ညာဘက်ထောင့် Logout ခလုတ် */}
        <div>
          <button 
            onClick={() => setIsAuthenticated(false)} 
            style={{
              padding: '8px 18px',
              cursor: 'pointer',
              backgroundColor: '#e0f0fe',
              color: '#0369a1',
              border: '1px solid #bae0fd',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Analytics & Graph Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Total Card */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #dcebfa',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>
            စုစုပေါင်း Feedback
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#0f4c81', marginTop: '6px' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>ကျောင်းသား/မိဘများထံမှ</div>
        </div>

        {/* Positive Card */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #bbf7d0',
          borderLeft: '5px solid #22c55e',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <div style={{ color: '#15803d', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>
            😊 Positive (ကျေနပ်မှု)
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#16a34a', marginTop: '6px' }}>
            {stats.positive} <span style={{ fontSize: '16px', fontWeight: '500', color: '#64748b' }}>({stats.posPercent}%)</span>
          </div>
          <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>အကောင်းဘက်မြင် သုံးသပ်ချက်များ</div>
        </div>

        {/* Negative Card */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #fecaca',
          borderLeft: '5px solid #ef4444',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <div style={{ color: '#b91c1c', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>
            😞 Negative (တိုးတက်ရန်လို)
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#dc2626', marginTop: '6px' }}>
            {stats.negative} <span style={{ fontSize: '16px', fontWeight: '500', color: '#64748b' }}>({stats.negPercent}%)</span>
          </div>
          <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>ဖြေရှင်းပေးရန် လိုအပ်ချက်များ</div>
        </div>

        {/* Neutral Card */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          borderLeft: '5px solid #64748b',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <div style={{ color: '#475569', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>
            😐 Neutral (မေးခွန်း/အလယ်အလတ်)
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#475569', marginTop: '6px' }}>
            {stats.neutral} <span style={{ fontSize: '16px', fontWeight: '500', color: '#64748b' }}>({stats.neuPercent}%)</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>ယေဘုယျ မေးမြန်းစုံစမ်းချက်များ</div>
        </div>
      </div>

      {/* Visual Sentiment Distribution Graph Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '20px 24px',
        borderRadius: '12px',
        border: '1px solid #dcebfa',
        marginBottom: '24px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f4c81' }}>📈 Sentiment Ratio Overview (အချိုးအစား ဂရပ်)</span>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Positive {stats.posPercent}% | Negative {stats.negPercent}% | Neutral {stats.neuPercent}%</span>
        </div>

        <div style={{
          display: 'flex',
          height: '14px',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#e2e8f0',
          gap: '2px'
        }}>
          {stats.positive > 0 && (
            <div style={{ width: `${stats.posPercent}%`, backgroundColor: '#22c55e', transition: 'width 0.4s ease' }} title={`Positive: ${stats.posPercent}%`} />
          )}
          {stats.negative > 0 && (
            <div style={{ width: `${stats.negPercent}%`, backgroundColor: '#ef4444', transition: 'width 0.4s ease' }} title={`Negative: ${stats.negPercent}%`} />
          )}
          {stats.neutral > 0 && (
            <div style={{ width: `${stats.neuPercent}%`, backgroundColor: '#94a3b8', transition: 'width 0.4s ease' }} title={`Neutral: ${stats.neuPercent}%`} />
          )}
        </div>
      </div>

      {/* Table Container & Filter Toolbar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #dcebfa',
        boxShadow: '0 4px 12px rgba(15, 76, 129, 0.04)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Sentiment Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['All', 'Positive', 'Negative', 'Neutral'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterSentiment(type)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  backgroundColor: filterSentiment === type ? '#2563eb' : '#e2e8f0',
                  color: filterSentiment === type ? '#ffffff' : '#475569',
                  transition: 'all 0.2s'
                }}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <input
            type="text"
            placeholder="🔍 Comment / Aspect ရှာရန်..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              outline: 'none',
              width: '240px'
            }}
          />
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f7ff', color: '#0f4c81', borderBottom: '2px solid #d0e4ff' }}>
                <th style={{ padding: '14px 20px', width: '60px' }}>ID</th>
                <th style={{ padding: '14px 20px', width: '110px' }}>Role</th>
                <th style={{ padding: '14px 20px' }}>Comment / Feedback</th>
                <th style={{ padding: '14px 20px', width: '150px' }}>Aspect (နယ်ပယ်)</th>
                <th style={{ padding: '14px 20px', width: '130px' }}>Sentiment</th>
                <th style={{ padding: '14px 20px', width: '90px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredComments.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                    Feedback မှတ်တမ်း မရှိသေးပါ။
                  </td>
                </tr>
              ) : (
                filteredComments.map((item, index) => {
                  const sent = item.sentiment?.toLowerCase();
                  return (
                    <tr 
                      key={item.id} 
                      style={{
                        borderBottom: '1px solid #edf2f7',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#fbfdff',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <td style={{ padding: '14px 20px', color: '#64748b', fontWeight: '600' }}>#{item.id}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {item.user_role || 'Student'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', color: '#1e293b', lineHeight: '1.5' }}>
                        {item.comment_text}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontWeight: '600',
                          fontSize: '13px',
                          border: '1px solid #e2e8f0'
                        }}>
                          📌 {item.aspect || 'General'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          padding: '5px 12px',
                          borderRadius: '20px',
                          color: '#ffffff',
                          fontWeight: '700',
                          fontSize: '12px',
                          display: 'inline-block',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                          backgroundColor: 
                            sent === 'positive' ? '#22c55e' : 
                            sent === 'negative' ? '#ef4444' : '#64748b'
                        }}>
                          {sent === 'positive' ? '● Positive' : sent === 'negative' ? '● Negative' : '● Neutral'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          title="ဖျက်မည်"
                          style={{
                            backgroundColor: '#fee2e2',
                            color: '#ef4444',
                            border: '1px solid #fecaca',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '12px',
                            transition: 'all 0.2s'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};