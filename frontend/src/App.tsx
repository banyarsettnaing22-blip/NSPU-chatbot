import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Chatbot from './Chatbot';
import { AdminDashboard } from './AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* သာမန် User များအတွက် Chatbot */}
        <Route path="/" element={<Chatbot />} />

        {/* Admin သီးသန့် Dashboard */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;