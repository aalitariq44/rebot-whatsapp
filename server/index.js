const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const moment = require('moment');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// WhatsApp Client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

// App State
let appState = {
  isReady: false,
  selectedContact: null,
  isActive: false,
  conversations: new Map(),
  settings: {
    responseDelayMin: parseInt(process.env.DEFAULT_RESPONSE_DELAY_MIN) || 4,
    responseDelayMax: parseInt(process.env.DEFAULT_RESPONSE_DELAY_MAX) || 120,
    personalityMode: 'friendly',
    autoReply: false
  }
};

// AI Personality Prompts
const personalityPrompts = {
  friendly: `أنت شخص ودود ومرح تحب تكوين صداقات جديدة. تتكلم بطريقة طبيعية وعفوية. 
            تبدأ المحادثات بطريقة لطيفة وتحاول إيجاد نقاط مشتركة. 
            تطرح أسئلة مثيرة للاهتمام وتظهر اهتماماً حقيقياً بالطرف الآخر.
            تستخدم الرموز التعبيرية بشكل طبيعي ومناسب.`,
  
  formal: `أنت شخص مهذب ومحترم. تتكلم بطريقة راقية ومتزنة. 
           تحافظ على الحدود المناسبة وتركز على المواضيع الجيدة والمفيدة.
           تظهر الاحترام والتقدير للطرف الآخر.`,
  
  casual: `أنت شخص عفوي وطبيعي جداً. تتكلم مثل الأصدقاء المقربين. 
           تستخدم التعبيرات الشائعة والعامية بطريقة طبيعية.
           تكون مرتاحاً في المحادثة ولا تتكلف.`
};

// WhatsApp Event Handlers
client.on('qr', (qr) => {
  console.log('اختبار ذكاء اصطناعي - جاري إنشاء QR Code...');
  qrcode.generate(qr, { small: true });
  io.emit('qr', qr);
});

client.on('ready', () => {
  console.log('اختبار ذكاء اصطناعي - WhatsApp Client جاهز!');
  appState.isReady = true;
  io.emit('whatsapp-ready');
});

client.on('message', async (message) => {
  if (!appState.isActive || !appState.selectedContact) return;
  
  const contact = await message.getContact();
  if (contact.id._serialized !== appState.selectedContact.id) return;
  
  console.log(`اختبار ذكاء اصطناعي - رسالة واردة من ${contact.pushname}: ${message.body}`);
  
  // Save message to conversation history
  const conversationId = contact.id._serialized;
  if (!appState.conversations.has(conversationId)) {
    appState.conversations.set(conversationId, []);
  }
  
  appState.conversations.get(conversationId).push({
    id: Date.now(),
    from: 'them',
    text: message.body,
    timestamp: moment().format(),
    sender: contact.pushname
  });
  
  // Emit to frontend
  io.emit('message-received', {
    from: contact.pushname,
    text: message.body,
    timestamp: moment().format()
  });
  
  // Generate AI response
  if (appState.settings.autoReply) {
    await generateAndSendResponse(conversationId, contact);
  }
});

// AI Response Generation
async function generateAndSendResponse(conversationId, contact) {
  try {
    const conversation = appState.conversations.get(conversationId) || [];
    const conversationHistory = conversation.slice(-20).map(msg => 
      `${msg.from === 'them' ? contact.pushname : 'أنا'}: ${msg.text}`
    ).join('\n');
    
    const systemPrompt = `اختبار ذكاء اصطناعي

${personalityPrompts[appState.settings.personalityMode]}

تذكر:
- هذا اختبار ذكاء اصطناعي لأغراض البحث
- تكلم بطريقة طبيعية 100% مثل إنسان حقيقي
- لا تذكر أنك ذكاء اصطناعي
- استخدم المعلومات من المحادثة السابقة
- اجعل الرد قصيراً ومناسباً للسياق
- ادرس شخصية المتحدث من رسائله السابقة
- تكيف مع أسلوبه في الكلام

تاريخ المحادثة:
${conversationHistory}

اكتب رداً طبيعياً ومناسباً على آخر رسالة:`;

    const result = await model.generateContent(systemPrompt);
    const aiResponse = result.response.text().trim();
    
    // Calculate response delay based on social psychology
    const responseDelay = calculateResponseDelay(conversation, aiResponse);
    
    console.log(`اختبار ذكاء اصطناعي - سيتم الرد خلال ${responseDelay} ثانية`);
    
    // Emit typing indicator
    io.emit('ai-typing', { contact: contact.pushname, delay: responseDelay });
    
    // Wait for calculated delay
    setTimeout(async () => {
      // Send the message
      await client.sendMessage(conversationId, aiResponse);
      
      // Save AI response to conversation
      conversation.push({
        id: Date.now(),
        from: 'me',
        text: aiResponse,
        timestamp: moment().format(),
        sender: 'AI Assistant'
      });
      
      // Emit to frontend
      io.emit('message-sent', {
        to: contact.pushname,
        text: aiResponse,
        timestamp: moment().format(),
        delay: responseDelay
      });
      
      console.log(`اختبار ذكاء اصطناعي - تم إرسال الرد: ${aiResponse}`);
      
    }, responseDelay * 1000);
    
  } catch (error) {
    console.error('خطأ في إنشاء الرد:', error);
    io.emit('error', { message: 'خطأ في إنشاء الرد الذكي' });
  }
}

// Smart Response Delay Calculation
function calculateResponseDelay(conversation, response) {
  const { responseDelayMin, responseDelayMax } = appState.settings;
  
  // Base delay
  let delay = Math.random() * (responseDelayMax - responseDelayMin) + responseDelayMin;
  
  // Adjust based on conversation context
  const lastMessages = conversation.slice(-5);
  const recentActivity = lastMessages.filter(msg => 
    moment().diff(moment(msg.timestamp), 'minutes') < 10
  ).length;
  
  // If conversation is active, respond faster
  if (recentActivity > 3) {
    delay = Math.max(delay * 0.5, responseDelayMin);
  }
  
  // Adjust based on response length
  const responseLength = response.length;
  if (responseLength > 100) {
    delay += Math.random() * 30; // Longer messages take more time to type
  }
  
  // Add some randomness for natural feel
  delay += (Math.random() - 0.5) * 20;
  
  return Math.max(Math.min(delay, responseDelayMax), responseDelayMin);
}

// Socket.IO Event Handlers
io.on('connection', (socket) => {
  console.log('اختبار ذكاء اصطناعي - عميل متصل');
  
  // Send current app state
  socket.emit('app-state', {
    isReady: appState.isReady,
    selectedContact: appState.selectedContact,
    isActive: appState.isActive,
    settings: appState.settings
  });
  
  socket.on('get-contacts', async () => {
    if (!appState.isReady) {
      socket.emit('error', { message: 'WhatsApp غير متصل' });
      return;
    }
    
    try {
      const chats = await client.getChats();
      const contacts = chats
        .filter(chat => !chat.isGroup)
        .slice(0, 50)
        .map(chat => ({
          id: chat.id._serialized,
          name: chat.name,
          lastMessage: chat.lastMessage?.body?.substring(0, 50) || '',
          timestamp: chat.timestamp
        }));
      
      socket.emit('contacts-list', contacts);
    } catch (error) {
      console.error('خطأ في جلب جهات الاتصال:', error);
      socket.emit('error', { message: 'خطأ في جلب جهات الاتصال' });
    }
  });
  
  socket.on('select-contact', (contactId) => {
    appState.selectedContact = { id: contactId };
    socket.emit('contact-selected', contactId);
    console.log(`اختبار ذكاء اصطناعي - تم اختيار جهة الاتصال: ${contactId}`);
  });
  
  socket.on('start-conversation', () => {
    appState.isActive = true;
    io.emit('conversation-started');
    console.log('اختبار ذكاء اصطناعي - بدء المحادثة الذكية');
  });
  
  socket.on('stop-conversation', () => {
    appState.isActive = false;
    io.emit('conversation-stopped');
    console.log('اختبار ذكاء اصطناعي - توقف المحادثة');
  });
  
  socket.on('send-manual-message', async (data) => {
    if (!appState.selectedContact) return;
    
    try {
      await client.sendMessage(appState.selectedContact.id, data.message);
      socket.emit('message-sent', {
        text: data.message,
        timestamp: moment().format(),
        manual: true
      });
    } catch (error) {
      socket.emit('error', { message: 'خطأ في إرسال الرسالة' });
    }
  });
  
  socket.on('update-settings', (settings) => {
    appState.settings = { ...appState.settings, ...settings };
    io.emit('settings-updated', appState.settings);
    console.log('اختبار ذكاء اصطناعي - تم تحديث الإعدادات:', settings);
  });
  
  socket.on('get-conversation-history', (contactId) => {
    const conversation = appState.conversations.get(contactId) || [];
    socket.emit('conversation-history', conversation);
  });
  
  socket.on('disconnect', () => {
    console.log('اختبار ذكاء اصطناعي - عميل منقطع');
  });
});

// Routes
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    message: 'اختبار ذكاء اصطناعي - الخادم يعمل',
    whatsappReady: appState.isReady,
    activeConversation: appState.isActive
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    totalConversations: appState.conversations.size,
    selectedContact: appState.selectedContact,
    isActive: appState.isActive,
    settings: appState.settings
  });
});

// Initialize WhatsApp Client
client.initialize();

// Start Server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🤖 اختبار ذكاء اصطناعي - الخادم يعمل على المنفذ ${PORT}`);
  console.log(`📱 WhatsApp AI Chatbot بدء التشغيل...`);
});
