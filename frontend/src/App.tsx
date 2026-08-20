import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Chatbot from './Chatbot';
import { AdminDashboard } from './AdminDashboard';
import CommentPage from './CommentPage'; // 💡 1. Import CommentPage here

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* သာမန် User များအတွက် Chatbot */}
        <Route path="/" element={<Chatbot />} />

        {/* 💡 2. Add Feedback / Comment Page routes here */}
        <Route path="/feedback" element={<CommentPage />} />
        <Route path="/comment" element={<CommentPage />} />

        {/* Admin သီးသန့် Dashboard */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;