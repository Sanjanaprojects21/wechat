import { useState, useRef, useEffect } from 'react';
import {
  Search,
  MessageSquare,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  Mic,
  Send,
  Lock,
  ArrowLeft,
  Settings,
  Users,
  Image as ImageIcon,
  Music,
  FileText,
  LogOut
} from 'lucide-react';
import './index.css';
import EmojiPicker from 'emoji-picker-react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import { supabase } from './supabaseClient';

const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY || 'sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh'); // backup key in case env isn't loaded

const initialChats = [
  {
    id: 1,
    name: "John Doe",
    avatar: "J",
    lastMessage: "Are we still on for tomorrow?",
    time: "10:42 AM",
    unread: 2,
    online: true,
    messages: [
      { id: 1, text: "Hey! How are you?", sender: "them", time: "10:30 AM" },
      { id: 2, text: "I'm good, thanks! Just finishing up some work.", sender: "me", time: "10:32 AM" },
      { id: 3, text: "Are we still on for tomorrow?", sender: "them", time: "10:42 AM" },
    ]
  },
  {
    id: 2,
    name: "Sarah Smith",
    avatar: "S",
    lastMessage: "Thanks for the presentation!",
    time: "Yesterday",
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: "Here is the presentation file.", sender: "me", time: "Yesterday, 4:00 PM" },
      { id: 2, text: "Thanks for the presentation!", sender: "them", time: "Yesterday, 4:05 PM" },
    ]
  },
  {
    id: 3,
    name: "Design Team",
    avatar: "D",
    lastMessage: "Alex: I'll update the components",
    time: "Yesterday",
    unread: 5,
    online: true,
    messages: [
      { id: 1, text: "Did everyone review the new mockup?", sender: "them", time: "Yesterday, 2:00 PM" },
      { id: 2, text: "Looks great to me.", sender: "me", time: "Yesterday, 2:15 PM" },
      { id: 3, text: "Alex: I'll update the components", sender: "them", time: "Yesterday, 2:30 PM" },
    ]
  },
  {
    id: 4,
    name: "Michael Chen",
    avatar: "M",
    lastMessage: "Let's connect later.",
    time: "Tuesday",
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: "Can you review my PR?", sender: "them", time: "Tuesday, 9:00 AM" },
      { id: 2, text: "Sure, I'll take a look.", sender: "me", time: "Tuesday, 9:30 AM" },
      { id: 3, text: "Let's connect later.", sender: "them", time: "Tuesday, 10:00 AM" },
    ]
  },
  {
    id: 5,
    name: "Emma Wilson",
    avatar: "E",
    lastMessage: "Got it.",
    time: "Monday",
    unread: 0,
    online: true,
    messages: [
      { id: 1, text: "Please send me the invoice.", sender: "them", time: "Monday, 11:00 AM" },
      { id: 2, text: "Sent via email.", sender: "me", time: "Monday, 11:15 AM" },
      { id: 3, text: "Got it.", sender: "them", time: "Monday, 11:20 AM" },
    ]
  }
];

function App() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const attachmentMenuRef = useRef(null);
  const gifPickerRef = useRef(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearchTerm, setGifSearchTerm] = useState('');
  const [targetLang, setTargetLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [authError, setAuthError] = useState('');

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setCurrentUser(session.user);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setCurrentUser(session.user);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    });
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    // Use the actual input as an email directly, or fallback to treating it explicitly.
    // If the user didn't enter an '@', append a pseudo domain so it still registers cleanly in Supabase.
    let userEmail = authForm.username.trim().toLowerCase();
    if (!userEmail.includes('@')) {
      userEmail = `${userEmail.replace(/\s+/g, '')}@wechat.local`;
    }

    if (authMode === 'signup') {
      if (!authForm.username || !authForm.password || !authForm.confirmPassword) {
        setAuthError('Please fill in all fields.');
        return;
      }
      if (authForm.password !== authForm.confirmPassword) {
        setAuthError('Passwords do not match.');
        return;
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: userEmail,
        password: authForm.password,
      });

      if (error) {
        setAuthError(error.message);
      } else if (data.user) {
        // Create profile for UI mapping
        await supabase.from('profiles').insert([
          { id: data.user.id, username: authForm.username, is_online: true }
        ]);
        alert('Signup successful! Please log in.');
        toggleAuthMode();
      }
    } else {
      if (!authForm.username || !authForm.password) {
        setAuthError('Please enter username and password.');
        return;
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: authForm.password,
      });

      if (error) {
        setAuthError(error.message);
      } else if (data.user) {
        // Use upsert so that if the profile didn't exist (e.g., they registered before the DB was ready), it gets created now.
        const { error: profileError } = await supabase.from('profiles').upsert({ 
          id: data.user.id, 
          username: authForm.username, 
          is_online: true 
        });
        if (profileError) {
          console.error("Error creating/updating profile:", profileError);
        }
        setIsAuthenticated(true);
        setCurrentUser(data.user);
      }
    }
  };

  const toggleAuthMode = () => {
    setAuthMode(prev => prev === 'login' ? 'signup' : 'login');
    setAuthError('');
    setAuthForm({ username: '', password: '', confirmPassword: '' });
  };

  const fetchGifs = (offset) => {
    if (gifSearchTerm.trim() === '') {
      return gf.trending({ offset, limit: 10 });
    }
    return gf.search(gifSearchTerm, { offset, limit: 10 });
  };

  useEffect(() => {
    if (!currentUser) return;

    const loadData = async () => {
      // Fetch all other profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUser.id);

      // Fetch my messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: true });

      // Transform into the chats format
      const formattedChats = (profilesData || []).map(profile => {
        const profileMessages = (messagesData || []).filter(
          m => m.sender_id === profile.id || m.receiver_id === profile.id
        );

        const lastMsg = profileMessages.length > 0 
          ? profileMessages[profileMessages.length - 1] 
          : null;

        return {
          id: profile.id, // using uuid now instead of counter
          name: profile.username,
          avatar: profile.username.charAt(0).toUpperCase(),
          lastMessage: lastMsg?.text || (lastMsg?.attachment_url ? lastMsg?.attachment_type : "No messages yet"),
          time: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          unread: 0,
          online: profile.is_online,
          messages: profileMessages.map(m => ({
            id: m.id,
            text: m.text,
            sender: m.sender_id === currentUser.id ? 'me' : 'them',
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            attachment: m.attachment_url ? { type: m.attachment_type, url: m.attachment_url, name: m.text || m.attachment_type } : null
          }))
        };
      });

      setChats(formattedChats);
    };

    loadData();

    // Subscribe to new messages
    const messageSubscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const newMsg = payload.new;
        if (newMsg.sender_id !== currentUser.id && newMsg.receiver_id !== currentUser.id) return;
        
        setChats(prev => prev.map(chat => {
          const isRelevant = chat.id === newMsg.sender_id || chat.id === newMsg.receiver_id;
          if (!isRelevant) return chat;

          const formattedMsg = {
            id: newMsg.id,
            text: newMsg.text,
            sender: newMsg.sender_id === currentUser.id ? 'me' : 'them',
            time: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            attachment: newMsg.attachment_url ? { type: newMsg.attachment_type, url: newMsg.attachment_url, name: newMsg.text || newMsg.attachment_type } : null
          };

          return {
            ...chat,
            lastMessage: formattedMsg.text || formattedMsg.attachment?.type,
            time: formattedMsg.time,
            messages: [...chat.messages, formattedMsg]
          };
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
    };
  }, [currentUser]);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target)) {
        setShowAttachmentMenu(false);
      }
      if (gifPickerRef.current && !gifPickerRef.current.contains(event.target)) {
        setShowGifPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChatId, chats]);

  const activeChat = chats.find(c => c.id === activeChatId);

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async (e, sender = "me") => {
    e?.preventDefault();
    if (!inputText.trim() || !activeChatId || isTranslating) return;

    let textToSend = inputText;

    if (targetLang !== 'en') {
      setIsTranslating(true);
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          alert("Please set VITE_GEMINI_API_KEY in your .env file to use translation features!");
          setIsTranslating(false);
          return;
        }

        const langMap = {
          'hi': 'Hindi',
          'kn': 'Kannada',
          'te': 'Telugu',
          'ta': 'Tamil',
          'mr': 'Marathi'
        };
        const langName = langMap[targetLang] || 'English';

        const prompt = `Translate the following text into ${langName}. Preserve the proper meaning, context, and tone. Reply ONLY with the translated text without quotes or explanations:\n\n${textToSend}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        const data = await response.json();
        if (data.error) {
          console.error("Gemini Error:", data.error);
          alert("Translation error: " + data.error.message);
          setIsTranslating(false);
          return;
        } else if (data.candidates && data.candidates.length > 0) {
          textToSend = data.candidates[0].content.parts[0].text.trim();
        }
      } catch (err) {
        console.error("Translation Error:", err);
        alert("Failed to communicate with translation server.");
        setIsTranslating(false);
        return;
      }
      setIsTranslating(false);
    }

    setInputText("");
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);
    setShowGifPicker(false);

    await supabase.from('messages').insert([{
      sender_id: currentUser.id,
      receiver_id: activeChatId,
      text: textToSend
    }]);
  };

  const handleGifClick = async (gif, e, sender = "me") => {
    e?.preventDefault();
    if (!activeChatId) return;

    await supabase.from('messages').insert([{
      sender_id: currentUser.id,
      receiver_id: activeChatId,
      attachment_url: gif.images.original.url,
      attachment_type: 'gif'
    }]);

    setInputText("");
    setShowGifPicker(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeChatId) return;

    setShowAttachmentMenu(false);

    try {
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${currentUser.id}/${fileName}`;

      // Determine attachment_type based on MIME type
      let attachmentType = 'document';
      if (file.type.startsWith('image/')) attachmentType = 'image';
      else if (file.type.startsWith('video/')) attachmentType = 'video';
      else if (file.type.startsWith('audio/')) attachmentType = 'audio';

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) {
        console.error('File upload error:', uploadError);
        alert(`Upload error: ${uploadError.message}. Make sure you ran the SQL to create the 'chat-attachments' bucket in Supabase!`);
        return;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      // Insert message with attachment into DB
      const { error: dbError } = await supabase.from('messages').insert([{
        sender_id: currentUser.id,
        receiver_id: activeChatId,
        attachment_url: publicUrl,
        attachment_type: attachmentType,
        text: file.name
      }]);

      if (dbError) {
        console.error('Database insertion error:', dbError);
        alert('Failed to send file message.');
      }
    } catch (err) {
      console.error('Error during file upload:', err);
      alert('An unexpected error occurred uploading the file.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = null; // reset input
      }
    }
  };

  const triggerFileInput = (acceptType) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptType;
      fileInputRef.current.click();
    }
  };

  const handleChatSelect = (id) => {
    setActiveChatId(id);
    setChats(prev => prev.map(chat =>
      chat.id === id ? { ...chat, unread: 0 } : chat
    ));
  };

  const handleBack = () => {
    setActiveChatId(null);
  };

  const handleLogout = async () => {
    if (currentUser) {
      await supabase.from('profiles').update({ is_online: false }).eq('id', currentUser.id);
    }
    await supabase.auth.signOut();
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-page">
        <div className="auth-header-bg"></div>
        <div className="auth-header-content">
          <MessageSquare size={32} />
          <span className="auth-title">WECHAT WEB</span>
        </div>
        
        <div className="auth-card">
          <h2>{authMode === 'login' ? 'Log in to WeChat' : 'Sign up for WeChat'}</h2>
          
          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {authError && <div className="auth-error">{authError}</div>}
            
            <div className="auth-input-group">
              <label>Email / Unique ID</label>
              <input 
                type="text" 
                className="auth-input"
                placeholder="Enter email or unique ID"
                value={authForm.username}
                onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
              />
            </div>
            
            <div className="auth-input-group">
              <label>Password</label>
              <input 
                type="password" 
                className="auth-input"
                placeholder="Enter password"
                value={authForm.password}
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
              />
            </div>

            {authMode === 'signup' && (
              <div className="auth-input-group">
                <label>Confirm Password</label>
                <input 
                  type="password" 
                  className="auth-input"
                  placeholder="Confirm password"
                  value={authForm.confirmPassword}
                  onChange={(e) => setAuthForm({...authForm, confirmPassword: e.target.value})}
                />
              </div>
            )}
            
            <button type="submit" className="auth-button">
              {authMode === 'login' ? 'Log In' : 'Sign Up'}
            </button>

            <div className="auth-switch">
              {authMode === 'login' ? (
                <>Don't have an account? <span onClick={toggleAuthMode}>Sign up here</span></>
              ) : (
                <>Already have an account? <span onClick={toggleAuthMode}>Log in instead</span></>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className={`sidebar ${activeChatId && isMobileView ? 'hidden' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="user-avatar" title={currentUser?.email}>{currentUser?.email?.charAt(0).toUpperCase() || "M"}</div>
          <div className="header-icons">
            <div className="header-icon"><Users size={20} /></div>
            <div className="header-icon"><MessageSquare size={20} /></div>
            <div className="header-icon" onClick={handleLogout} title="Log Out"><LogOut size={20} /></div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-container">
          <div className="search-bar">
            <div className="search-placeholder"><Search size={16} /></div>
            <input
              type="text"
              className="search-input"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="chat-list">
          {filteredChats.map(chat => (
            <div
              key={chat.id}
              className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
              onClick={() => handleChatSelect(chat.id)}
            >
              <div className="chat-item-avatar">{chat.avatar}</div>
              <div className="chat-item-info">
                <div className="chat-item-header">
                  <span className="chat-item-name">{chat.name}</span>
                  <span className="chat-item-time">{chat.time}</span>
                </div>
                <div className="message-preview-row">
                  <span className="chat-item-message">{chat.lastMessage}</span>
                  {chat.unread > 0 && (
                    <span className="unread-badge">{chat.unread}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      {activeChat ? (
        <div className={`chat-area active`}>
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="back-button" onClick={handleBack}>
                <ArrowLeft size={24} />
              </div>
              <div className="chat-header-avatar">{activeChat.avatar}</div>
              <div className="chat-header-text">
                <span className="chat-header-name">{activeChat.name}</span>
                <span className="chat-header-status">{activeChat.online ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            <div className="header-icons">
              <div className="header-icon"><Video size={20} /></div>
              <div className="header-icon"><Phone size={20} /></div>
              <div className="header-icon"><Search size={20} /></div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="messages-area">
            <div className="date-separator">
              <span>Today</span>
            </div>

            {activeChat.messages.map((message) => {
              const messageClass = message.sender === 'me' ? 'sent' : 'received';
              const isMedia = message.attachment?.type === 'image' || message.attachment?.type === 'video' || message.attachment?.type === 'gif';
              return (
                <div key={message.id} className={`message-row ${messageClass}`}>
                  <div className={`message-bubble ${messageClass} ${isMedia ? 'media-bubble' : ''}`}>
                    {message.attachment ? (
                      <div className="message-attachment">
                        {message.attachment.type === 'image' && (
                          <a href={message.attachment.url} target="_blank" rel="noopener noreferrer">
                            <img src={message.attachment.url} alt={message.attachment.name} className="attachment-image-preview" />
                          </a>
                        )}
                        {message.attachment.type === 'gif' && (
                          <img src={message.attachment.url} alt={message.attachment.name} className="attachment-gif-preview" />
                        )}
                        {message.attachment.type === 'video' && (
                          <video src={message.attachment.url} controls className="attachment-video-preview" />
                        )}
                        {message.attachment.type === 'audio' && (
                          <audio src={message.attachment.url} controls className="attachment-audio-preview" />
                        )}
                        {message.attachment.type === 'document' && (
                          <a 
                            href={message.attachment.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="attachment-document-preview"
                            style={{ textDecoration: 'none' }}
                          >
                            <div className="doc-icon"><FileText size={24} /></div>
                            <span className="doc-name">{message.attachment.name}</span>
                          </a>
                        )}
                      </div>
                    ) : (
                      <span>{message.text}</span>
                    )}
                    <span className={`message-time ${isMedia ? 'media-time' : ''}`}>{message.time}</span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="chat-input-container" style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }} ref={emojiPickerRef}>
              <div className="input-icon" onClick={() => setShowEmojiPicker(prev => !prev)}>
                <Smile size={24} />
              </div>

              {showEmojiPicker && (
                <div 
                  className="emoji-picker-container" 
                  style={{ 
                    position: 'absolute', 
                    bottom: '80px', 
                    left: '16px', 
                    zIndex: 1000,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    borderRadius: '10px'
                  }}
                >
                  <EmojiPicker 
                    onEmojiClick={(emojiObject) => {
                      setInputText(prev => prev + emojiObject.emoji);
                    }} 
                  />
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }} ref={attachmentMenuRef}>
              <div className="input-icon" onClick={() => setShowAttachmentMenu(prev => !prev)}>
                <Paperclip size={24} />
              </div>

              {showAttachmentMenu && (
                <div className="attachment-menu">
                  <div className="attachment-item image" onClick={() => triggerFileInput('image/*')}>
                    <div className="attachment-icon-wrapper"><ImageIcon size={24} /></div>
                    <span>Photos</span>
                  </div>
                  <div className="attachment-item video" onClick={() => triggerFileInput('video/*')}>
                    <div className="attachment-icon-wrapper"><Video size={24} /></div>
                    <span>Videos</span>
                  </div>
                  <div className="attachment-item audio" onClick={() => triggerFileInput('audio/*')}>
                    <div className="attachment-icon-wrapper"><Music size={24} /></div>
                    <span>Audio</span>
                  </div>
                  <div className="attachment-item document" onClick={() => triggerFileInput('*/*')}>
                    <div className="attachment-icon-wrapper"><FileText size={24} /></div>
                    <span>Document</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }} ref={gifPickerRef}>
              <div 
                className="input-icon" 
                onClick={() => setShowGifPicker(prev => !prev)}
                title="Send a GIF"
              >
                <div style={{ fontSize: '11px', fontWeight: 800, border: '2px solid #555', borderRadius: '4px', padding: '0 4px', display: 'flex', alignItems: 'center', height: '22px' }}>
                  GIF
                </div>
              </div>

              {showGifPicker && (
                <div 
                  className="giphy-popup-container"
                  style={{ 
                    position: 'absolute', 
                    bottom: '60px', 
                    left: 0, 
                    width: isMobileView ? 'calc(100vw - 32px)' : '350px',
                    height: '420px',
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    zIndex: 1000,
                    border: '1px solid #eaeaea'
                  }}
                >
                  {/* Dedicated Search Header */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #eaeaea', backgroundColor: '#fafafa' }}>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#e5e5e5', borderRadius: '20px', padding: '8px 14px' }}>
                      <Search size={16} color="#666" style={{ marginRight: '8px' }} />
                      <input 
                        type="text" 
                        placeholder="Search Tenor/Giphy..."
                        value={gifSearchTerm}
                        onChange={(e) => setGifSearchTerm(e.target.value)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', color: '#000' }}
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  {/* Grid Area */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '8px', backgroundColor: '#fff' }}>
                    <Grid 
                      width={isMobileView ? window.innerWidth - 48 : 332} 
                      columns={3} // Added 3 columns layout
                      gutter={6} 
                      fetchGifs={fetchGifs} 
                      key={gifSearchTerm} 
                      onGifClick={(gif, e) => handleGifClick(gif, e, "me")} 
                    />
                  </div>
                </div>
              )}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
            />

            <div style={{ position: 'relative' }}>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                title="Translate outgoing message"
                style={{
                  height: '100%',
                  border: 'none',
                  backgroundColor: 'transparent',
                  outline: 'none',
                  fontWeight: 'bold',
                  color: '#555',
                  cursor: 'pointer',
                  fontSize: '13px',
                  padding: '8px 4px',
                  appearance: 'none',
                  WebkitAppearance: 'none'
                }}
              >
                <option value="en">EN</option>
                <option value="hi">HI</option>
                <option value="kn">KN</option>
                <option value="te">TE</option>
                <option value="ta">TA</option>
                <option value="mr">MR</option>
              </select>
            </div>

            <div className="chat-input-wrapper">
              <input
                type="text"
                className="chat-input"
                placeholder={isTranslating ? "Translating..." : "Type a message or /gif to search..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage(e, "me");
                  }
                }}
                disabled={isTranslating}
              />
            </div>

            {inputText.trim() ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="send-button"
                  title="Send as Them (White Bubble)"
                  style={{ backgroundColor: '#ffffff', color: '#000', border: '1px solid #ddd' }}
                  onClick={(e) => handleSendMessage(e, "them")}
                >
                  <Send size={18} />
                </button>
                <button
                  type="button"
                  className="send-button"
                  title="Send as Me (Green Bubble)"
                  onClick={(e) => handleSendMessage(e, "me")}
                >
                  <Send size={18} />
                </button>
              </div>
            ) : (
              <div className="input-icon"><Mic size={24} /></div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className={`chat-area ${isMobileView ? '' : 'active'}`}>
          <div className="empty-state">
            <h1>WeChat Client</h1>
            <p>Select a chat to start messaging or search for contacts.</p>
            <div className="lock-icon">
              <Lock size={14} /> End-to-end encrypted
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
