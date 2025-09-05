# الوثائق التقنية - اختبار ذكاء اصطناعي

## هيكل المشروع

```
rebot - Copy/
├── server/                    # خادم Node.js
│   └── index.js              # الملف الرئيسي للخادم
├── client/                   # تطبيق React
│   ├── public/               # ملفات عامة
│   ├── src/                  # ملفات React
│   │   ├── App.js           # المكون الرئيسي
│   │   └── index.js         # نقطة دخول React
│   └── package.json         # تبعيات React
├── .env                     # متغيرات البيئة
├── .env.example             # نموذج متغيرات البيئة
├── package.json             # تبعيات المشروع الرئيسي
├── README.md                # دليل المشروع
└── USER_GUIDE.md           # دليل الاستخدام
```

## التقنيات المستخدمة

### Backend (Node.js)
- **Express.js**: إطار عمل خادم الويب
- **Socket.io**: تواصل فوري ثنائي الاتجاه
- **whatsapp-web.js**: تكامل مع WhatsApp Web
- **@google/generative-ai**: تكامل مع Gemini AI
- **moment**: معالجة التواريخ والأوقات

### Frontend (React)
- **React 18**: مكتبة واجهة المستخدم
- **Socket.io-client**: عميل التواصل الفوري
- **styled-components**: تنسيق المكونات
- **react-icons**: أيقونات React
- **qrcode.react**: عرض رموز QR

## معمارية التطبيق

### 1. طبقة الاتصال (Socket.io)
```javascript
// الأحداث الرئيسية
- 'qr': رمز QR للربط
- 'whatsapp-ready': جاهزية WhatsApp
- 'message-received': رسالة واردة
- 'message-sent': رسالة مرسلة
- 'ai-typing': الوكيل يكتب
```

### 2. طبقة الذكاء الاصطناعي
```javascript
// نمط الشخصية
personalityPrompts = {
  friendly: "شخصية ودودة ومرحة",
  formal: "شخصية رسمية ومهذبة", 
  casual: "شخصية عفوية وطبيعية"
}

// خوارزمية توقيت الرد
calculateResponseDelay(conversation, response) {
  // تحليل نشاط المحادثة
  // طول الرسالة
  // عشوائية طبيعية
}
```

### 3. طبقة إدارة المحادثات
```javascript
// هيكل المحادثة
conversationStructure = {
  id: "معرف فريد",
  messages: [
    {
      id: "معرف الرسالة",
      from: "them|me", 
      text: "نص الرسالة",
      timestamp: "ISO timestamp",
      sender: "اسم المرسل"
    }
  ]
}
```

## خوارزميات الذكاء الاصطناعي

### 1. تحليل السياق
```javascript
// تحليل المحادثة
analyzeConversation(messages) {
  - استخراج المعلومات الشخصية
  - تحديد نمط المحادثة
  - تقييم مستوى الاهتمام
  - تحليل المشاعر
}
```

### 2. إنشاء الردود
```javascript
// نظام إنشاء الردود
generateResponse(context) {
  1. تحليل الرسالة الواردة
  2. استدعاء تاريخ المحادثة
  3. تطبيق نمط الشخصية
  4. إنشاء رد مناسب للسياق
  5. تحسين طول وأسلوب الرد
}
```

### 3. توقيت الردود الذكي
```javascript
// حساب التوقيت المثلى
calculateOptimalTiming(factors) {
  factors = {
    conversationActivity: "مستوى نشاط المحادثة",
    messageLength: "طول الرسالة", 
    timeOfDay: "وقت اليوم",
    userBehavior: "سلوك المستخدم"
  }
}
```

## واجهات برمجة التطبيقات (APIs)

### REST APIs
```javascript
GET  /api/status     // حالة التطبيق
GET  /api/stats      // إحصائيات الاستخدام
```

### Socket.io Events
```javascript
// العميل إلى الخادم
'get-contacts'           // جلب جهات الاتصال
'select-contact'         // اختيار جهة اتصال
'start-conversation'     // بدء المحادثة
'stop-conversation'      // إيقاف المحادثة
'send-manual-message'    // إرسال رسالة يدوية
'update-settings'        // تحديث الإعدادات

// الخادم إلى العميل  
'qr'                    // رمز QR
'whatsapp-ready'        // جاهزية WhatsApp
'contacts-list'         // قائمة جهات الاتصال
'message-received'      // رسالة واردة
'message-sent'          // رسالة مرسلة
'ai-typing'             // الوكيل يكتب
'error'                 // رسالة خطأ
```

## إعدادات التكوين

### متغيرات البيئة (.env)
```bash
GEMINI_API_KEY           # مفتاح Gemini AI
PORT                     # منفذ الخادم
CLIENT_URL               # رابط العميل
WHATSAPP_SESSION_PATH    # مسار جلسة WhatsApp
DEFAULT_RESPONSE_DELAY_MIN  # الحد الأدنى للتأخير
DEFAULT_RESPONSE_DELAY_MAX  # الحد الأقصى للتأخير  
CONVERSATION_MEMORY_LIMIT   # حد ذاكرة المحادثة
```

### إعدادات الوكيل الذكي
```javascript
settings = {
  responseDelayMin: 4,      // ثوان
  responseDelayMax: 120,    // ثوان
  personalityMode: 'friendly', // نمط الشخصية
  autoReply: false          // الرد التلقائي
}
```

## الأمان والأداء

### حماية البيانات
- تشفير جلسة WhatsApp محلياً
- عدم تخزين مفاتيح API في الكود
- حماية متغيرات البيئة
- عدم رفع البيانات للخوادم الخارجية

### تحسين الأداء
- تحديد حد ذاكرة المحادثة
- معالجة الأخطاء بشكل متقدم
- تحسين استهلاك الذاكرة
- تحسين سرعة الاستجابة

## خطط التطوير المستقبلية

### المرحلة 2
- [ ] تحليل متقدم للمشاعر
- [ ] دعم الوسائط المتعددة
- [ ] ذاكرة طويلة المدى للشخصيات
- [ ] تحليل أنماط المحادثة

### المرحلة 3  
- [ ] دعم مجموعات WhatsApp
- [ ] واجهة إدارة متقدمة
- [ ] تقارير تحليلية مفصلة
- [ ] تكامل مع منصات أخرى

---

**تم التطوير لأغراض البحث الجامعي فقط**
