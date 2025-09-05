import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import QRCode from 'qrcode.react';
import { FaWhatsapp, FaRobot, FaCog, FaPlay, FaStop, FaUser, FaComments } from 'react-icons/fa';
import styled from 'styled-components';
import moment from 'moment';
import 'moment/locale/ar';

moment.locale('ar');

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
  padding: 20px;
  direction: rtl;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 30px;
  color: white;
  position: relative;
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 10px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  }
  
  .subtitle {
    font-size: 1.2rem;
    opacity: 0.9;
    margin-bottom: 5px;
  }
  
  .disclaimer {
    background: rgba(255,255,255,0.1);
    padding: 10px 20px;
    border-radius: 10px;
    font-weight: bold;
    color: #fff3cd;
    border: 2px solid rgba(255,255,255,0.2);
  }
  
  .test-button {
    position: absolute;
    top: 20px;
    left: 20px;
  }
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
`;

const StatusCard = styled(Card)`
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: bold;
  
  &.connected {
    background: #d4edda;
    color: #155724;
  }
  
  &.disconnected {
    background: #f8d7da;
    color: #721c24;
  }
  
  &.active {
    background: #cce5ff;
    color: #004085;
  }
`;

const QRContainer = styled.div`
  text-align: center;
  
  .qr-code {
    background: white;
    padding: 20px;
    border-radius: 15px;
    display: inline-block;
    margin: 20px 0;
  }
`;

const ContactsList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 10px;
  
  .contact-item {
    padding: 15px;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: background 0.2s;
    
    &:hover {
      background: #f8f9fa;
    }
    
    &.selected {
      background: #e3f2fd;
      border-right: 4px solid #2196f3;
    }
    
    .contact-name {
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .contact-last-message {
      font-size: 0.9rem;
      color: #666;
      opacity: 0.8;
    }
  }
`;

const ConversationArea = styled.div`
  .messages-container {
    height: 300px;
    overflow-y: auto;
    border: 1px solid #eee;
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 15px;
    background: #f8f9fa;
  }
  
  .message {
    margin-bottom: 15px;
    padding: 10px 15px;
    border-radius: 18px;
    max-width: 80%;
    
    &.outgoing {
      background: #dcf8c6;
      margin-right: auto;
      margin-left: 20%;
    }
    
    &.incoming {
      background: white;
      margin-left: auto;
      margin-right: 20%;
    }
    
    .message-text {
      margin-bottom: 5px;
    }
    
    .message-time {
      font-size: 0.8rem;
      color: #666;
      text-align: left;
    }
  }
`;

const ControlPanel = styled.div`
  .control-section {
    margin-bottom: 25px;
    
    h3 {
      margin-bottom: 15px;
      color: #333;
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }
  
  .control-row {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .slider-container {
    flex: 1;
    min-width: 200px;
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    input[type="range"] {
      width: 100%;
      margin-bottom: 5px;
    }
    
    .slider-value {
      font-size: 0.9rem;
      color: #666;
    }
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &.primary {
    background: #25d366;
    color: white;
    
    &:hover {
      background: #128c7e;
    }
  }
  
  &.secondary {
    background: #f0f0f0;
    color: #333;
    
    &:hover {
      background: #e0e0e0;
    }
  }
  
  &.danger {
    background: #dc3545;
    color: white;
    
    &:hover {
      background: #c82333;
    }
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  min-width: 150px;
`;

const Input = styled.input`
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  width: 100%;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 15px;
  padding: 25px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h3 {
      margin: 0;
      color: #333;
    }
    
    .close-button {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
      
      &:hover {
        color: #333;
      }
    }
  }
  
  .chat-messages {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #eee;
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 15px;
    background: #f8f9fa;
  }
  
  .message {
    margin-bottom: 15px;
    padding: 10px 15px;
    border-radius: 18px;
    max-width: 80%;
    
    &.user {
      background: #dcf8c6;
      margin-left: auto;
      margin-right: 20%;
    }
    
    &.ai {
      background: white;
      margin-right: auto;
      margin-left: 20%;
    }
  }
`;

function App() {
  const [socket, setSocket] = useState(null);
  const [appState, setAppState] = useState({
    isReady: false,
    selectedContact: null,
    isActive: false,
    settings: {
      responseDelayMin: 4,
      responseDelayMax: 120,
      personalityMode: 'friendly',
      autoReply: false
    }
  });
  const [qrCode, setQrCode] = useState('');
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [manualMessage, setManualMessage] = useState('');
  const [aiTyping, setAiTyping] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const intervalRef = useRef(null);
  
  // Gemini Test Modal State
  const [showGeminiTest, setShowGeminiTest] = useState(false);
  const [geminiMessages, setGeminiMessages] = useState([]);
  const [geminiInput, setGeminiInput] = useState('');
  const [geminiLoading, setGeminiLoading] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('app-state', (state) => {
      setAppState(state);
    });

    newSocket.on('qr', (qr) => {
      setQrCode(qr);
    });

    newSocket.on('whatsapp-ready', () => {
      setAppState(prev => ({ ...prev, isReady: true }));
      setQrCode('');
    });

    newSocket.on('contacts-list', (contactsList) => {
      setContacts(contactsList);
    });

    newSocket.on('message-received', (message) => {
      setMessages(prev => [...prev, {
        ...message,
        type: 'incoming',
        id: Date.now()
      }]);
    });

    newSocket.on('message-sent', (message) => {
      setMessages(prev => [...prev, {
        ...message,
        type: 'outgoing',
        id: Date.now()
      }]);
      setAiTyping(false);
      setAiPreview(null);
      setRemainingTime(null);
      if (intervalRef.current) clearInterval(intervalRef.current);
    });

    newSocket.on('ai-typing', (data) => {
      setAiTyping(true);
      setTimeout(() => setAiTyping(false), data.delay * 1000);
    });

    newSocket.on('ai-response-preview', (data) => {
      console.log('Received ai-response-preview:', data);
      setAiPreview(data);
      setRemainingTime(Math.floor(data.delay));
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    });

    newSocket.on('conversation-started', () => {
      setAppState(prev => ({ ...prev, isActive: true }));
    });

    newSocket.on('conversation-stopped', () => {
      setAppState(prev => ({ ...prev, isActive: false }));
    });

    newSocket.on('settings-updated', (settings) => {
      setAppState(prev => ({ ...prev, settings }));
    });

    return () => {
      newSocket.close();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleGetContacts = () => {
    socket?.emit('get-contacts');
  };

  const handleSelectContact = (contactId) => {
    setSelectedContactId(contactId);
    socket?.emit('select-contact', contactId);
    socket?.emit('get-conversation-history', contactId);
  };

  const handleStartConversation = () => {
    socket?.emit('start-conversation');
  };

  const handleStopConversation = () => {
    socket?.emit('stop-conversation');
  };

  const handleSendManualMessage = () => {
    if (manualMessage.trim()) {
      socket?.emit('send-manual-message', { message: manualMessage });
      setManualMessage('');
    }
  };

  const handleSettingsChange = (key, value) => {
    const newSettings = { ...appState.settings, [key]: value };
    socket?.emit('update-settings', newSettings);
  };

  const handleGeminiTest = async () => {
    if (!geminiInput.trim()) return;
    
    const userMessage = geminiInput.trim();
    setGeminiMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setGeminiInput('');
    setGeminiLoading(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/test-gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          personality: appState.settings.personalityMode
        }),
      });
      
      const data = await response.json();
      setGeminiMessages(prev => [...prev, { type: 'ai', text: data.response }]);
    } catch (error) {
      console.error('خطأ في اختبار Gemini:', error);
      setGeminiMessages(prev => [...prev, { type: 'ai', text: 'عذراً، حدث خطأ في الاتصال بـ Gemini' }]);
    } finally {
      setGeminiLoading(false);
    }
  };

  const clearGeminiChat = () => {
    setGeminiMessages([]);
  };

  return (
    <AppContainer>
      <Header>
        <div className="test-button">
          <Button className="secondary" onClick={() => setShowGeminiTest(true)}>
            <FaRobot /> اختبار Gemini
          </Button>
        </div>
        <h1>
          <FaRobot /> وكيل WhatsApp الذكي
        </h1>
        <div className="subtitle">نظام ذكي لبناء العلاقات الاجتماعية</div>
        <div className="disclaimer">
          🧪 هذا اختبار ذكاء اصطناعي - مشروع تخرج جامعي
        </div>
      </Header>

      <MainGrid>
        <StatusCard>
          <StatusIndicator className={appState.isReady ? 'connected' : 'disconnected'}>
            <FaWhatsapp />
            {appState.isReady ? 'WhatsApp متصل' : 'WhatsApp غير متصل'}
          </StatusIndicator>
          
          <StatusIndicator className={appState.isActive ? 'active' : 'disconnected'}>
            <FaComments />
            {appState.isActive ? 'المحادثة نشطة' : 'المحادثة متوقفة'}
          </StatusIndicator>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button className="secondary" onClick={handleGetContacts} disabled={!appState.isReady}>
              <FaUser /> جلب جهات الاتصال
            </Button>
            
            {appState.isActive ? (
              <Button className="danger" onClick={handleStopConversation}>
                <FaStop /> إيقاف المحادثة
              </Button>
            ) : (
              <Button className="primary" onClick={handleStartConversation} disabled={!selectedContactId}>
                <FaPlay /> بدء المحادثة
              </Button>
            )}
          </div>
        </StatusCard>

        {!appState.isReady && qrCode && (
          <Card>
            <QRContainer>
              <h3>امسح رمز QR بتطبيق WhatsApp</h3>
              <div className="qr-code">
                <QRCode value={qrCode} size={200} />
              </div>
              <p>افتح WhatsApp → الإعدادات → الأجهزة المرتبطة → ربط جهاز</p>
            </QRContainer>
          </Card>
        )}

        <Card>
          <h3><FaUser /> جهات الاتصال</h3>
          <ContactsList>
            {contacts.map(contact => (
              <div
                key={contact.id}
                className={`contact-item ${selectedContactId === contact.id ? 'selected' : ''}`}
                onClick={() => handleSelectContact(contact.id)}
              >
                <div className="contact-name">{contact.name}</div>
                <div className="contact-last-message">{contact.lastMessage}</div>
              </div>
            ))}
          </ContactsList>
        </Card>

        <Card>
          <h3><FaComments /> المحادثة</h3>
          <ConversationArea>
            <div className="messages-container">
              {messages.map(message => (
                <div key={message.id} className={`message ${message.type}`}>
                  <div className="message-text">{message.text}</div>
                  <div className="message-time">
                    {moment(message.timestamp).format('HH:mm')}
                  </div>
                </div>
              ))}
              {aiTyping && (
                <div className="message incoming">
                  <div className="message-text">🤖 يكتب رسالة...</div>
                </div>
              )}
              {aiPreview && (
                <div className="message incoming">
                  <div className="message-text">
                    <strong>معاينة الرد:</strong> {aiPreview.response}
                  </div>
                  <div className="message-time">
                    سيرد خلال {Math.floor(remainingTime !== null ? remainingTime : aiPreview.delay)} ثانية
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>
                    <strong>السبب:</strong> {aiPreview.reason}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <Input
                type="text"
                placeholder="اكتب رسالة يدوية..."
                value={manualMessage}
                onChange={(e) => setManualMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendManualMessage()}
              />
              <Button className="primary" onClick={handleSendManualMessage}>
                إرسال
              </Button>
            </div>
          </ConversationArea>
        </Card>

        <Card>
          <ControlPanel>
            <div className="control-section">
              <h3><FaCog /> إعدادات الوكيل الذكي</h3>
              
              <div className="control-row">
                <div style={{ flex: 1 }}>
                  <label>نمط الشخصية:</label>
                  <Select
                    value={appState.settings.personalityMode}
                    onChange={(e) => handleSettingsChange('personalityMode', e.target.value)}
                  >
                    <option value="friendly">ودود ومرح</option>
                    <option value="formal">رسمي ومهذب</option>
                    <option value="casual">عفوي وطبيعي</option>
                  </Select>
                </div>
                
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={appState.settings.autoReply}
                      onChange={(e) => handleSettingsChange('autoReply', e.target.checked)}
                    />
                    الرد التلقائي
                  </label>
                </div>
              </div>
              
              <div className="slider-container">
                <label>الحد الأدنى لتأخير الرد (ثانية): {appState.settings.responseDelayMin}</label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={appState.settings.responseDelayMin}
                  onChange={(e) => handleSettingsChange('responseDelayMin', parseInt(e.target.value))}
                />
              </div>
              
              <div className="slider-container">
                <label>الحد الأقصى لتأخير الرد (ثانية): {appState.settings.responseDelayMax}</label>
                <input
                  type="range"
                  min="30"
                  max="300"
                  value={appState.settings.responseDelayMax}
                  onChange={(e) => handleSettingsChange('responseDelayMax', parseInt(e.target.value))}
                />
              </div>
            </div>
          </ControlPanel>
        </Card>
      </MainGrid>

      {showGeminiTest && (
        <Modal>
          <ModalContent>
            <div className="modal-header">
              <h3><FaRobot /> اختبار Gemini AI</h3>
              <button className="close-button" onClick={() => setShowGeminiTest(false)}>×</button>
            </div>
            
            <div className="chat-messages">
              {geminiMessages.map((msg, index) => (
                <div key={index} className={`message ${msg.type}`}>
                  {msg.text}
                </div>
              ))}
              {geminiLoading && (
                <div className="message ai">
                  🤖 يكتب رد...
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <Input
                type="text"
                placeholder="اكتب رسالة لاختبار Gemini..."
                value={geminiInput}
                onChange={(e) => setGeminiInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGeminiTest()}
                disabled={geminiLoading}
              />
              <Button 
                className="primary" 
                onClick={handleGeminiTest}
                disabled={geminiLoading || !geminiInput.trim()}
              >
                إرسال
              </Button>
            </div>
            
            <Button className="secondary" onClick={clearGeminiChat} style={{ width: '100%' }}>
              مسح المحادثة
            </Button>
          </ModalContent>
        </Modal>
      )}
    </AppContainer>
  );
}

export default App;
