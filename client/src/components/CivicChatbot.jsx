import React, { useState } from 'react';
import axios from 'axios';
import { MessageSquare, Send, Sparkles, Globe, X, Bot, User, AlertCircle } from 'lucide-react';

export default function CivicChatbot({ isOpen, onClose, onSelectCategory }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Namaste! I am the Samadhan Civic Assistant. How can I help you report or resolve civic concerns in your ward today?',
      source: 'assistant',
    },
  ]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('en'); // 'en' | 'hi'
  const [loading, setLoading] = useState(false);
  const [lastServiceStatus, setLastServiceStatus] = useState(null);

  if (!isOpen) return null;

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const newMsgs = [...messages, { sender: 'user', text }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/ai/chat', {
        message: text,
        language,
      });

      if (res.data?.success) {
        setLastServiceStatus(res.data.serviceStatus);
        setMessages([
          ...newMsgs,
          {
            sender: 'bot',
            text: res.data.reply,
            category: res.data.suggestedCategory,
            serviceStatus: res.data.serviceStatus,
          },
        ]);
      }
    } catch {
      setMessages([
        ...newMsgs,
        {
          sender: 'bot',
          text: language === 'hi'
            ? 'क्षमा करें, इस समय संपर्क नहीं हो पा रहा है। कृपया कुछ देर बाद प्रयास करें।'
            : 'Sorry, unable to connect to the assistant engine at the moment. Please try again shortly.',
          serviceStatus: 'offline',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    { en: 'How to report a pothole?', hi: 'सड़क के गड्ढे की शिकायत कैसे करें?' },
    { en: 'Garbage dump near my house', hi: 'घर के पास कचरे का ढेर' },
    { en: 'How do platform points work?', hi: 'प्लेटफ़ॉर्म अंक कैसे काम करते हैं?' },
    { en: 'Official CPGRAMS link', hi: 'सरकारी शिकायत पोर्टल लिंक' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm sm:max-w-md bg-[#0f131a] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[520px]">
      {/* Chatbot Header */}
      <div className="p-4 bg-[#141822] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-[#e11d48] flex items-center justify-center border border-rose-500/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center space-x-1">
              <span>Samadhan Civic AI</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </h3>
            <span className="text-[10px] text-slate-400">
              {lastServiceStatus === 'rule_based_fallback'
                ? 'Rule-based Civic FAQ Mode'
                : 'Bilingual AI Assistant'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-300"
          >
            <Globe className="w-3 h-3" />
            <span>{language === 'en' ? 'EN' : 'HI'}</span>
          </button>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'bot' && (
              <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                AI
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl p-3 ${
                m.sender === 'user'
                  ? 'bg-[#e11d48] text-white rounded-tr-none'
                  : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none'
              }`}
            >
              <p className="leading-relaxed">{m.text}</p>
              {m.category && (
                <button
                  onClick={() => {
                    if (onSelectCategory) onSelectCategory(m.category);
                    onClose();
                  }}
                  className="mt-2 text-[10px] bg-white/10 hover:bg-white/20 text-emerald-400 font-bold px-2 py-1 rounded block"
                >
                  Start Report: {m.category} →
                </button>
              )}
            </div>
            {m.sender === 'user' && (
              <div className="w-6 h-6 rounded-full bg-white/10 text-slate-300 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                Me
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-rose-400" />
            <span>Consulting civic knowledge engine...</span>
          </div>
        )}
      </div>

      {/* Quick Suggestions */}
      <div className="px-3 py-2 bg-[#0c0e12] border-t border-white/5 flex gap-1.5 overflow-x-auto text-[10px]">
        {quickQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSend(language === 'hi' ? q.hi : q.en)}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10 shrink-0"
          >
            {language === 'hi' ? q.hi : q.en}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-[#141822] border-t border-white/10 flex items-center space-x-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={language === 'hi' ? 'अपनी शिकायत या सवाल लिखें...' : 'Ask about potholes, waste, points...'}
          className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2 rounded-xl bg-[#e11d48] hover:bg-[#be123c] text-white disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
