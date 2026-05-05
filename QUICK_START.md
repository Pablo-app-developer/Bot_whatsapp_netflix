# 📱 GUÍA VISUAL RÁPIDA - WhatsApp Bot

## 🎯 OBJETIVO
Configurar el bot de WhatsApp en **30 minutos** para vender desde tu celular.

---

## 📊 ARQUITECTURA

```
┌─────────────────┐
│   TU CELULAR    │
│   (WhatsApp)    │
└────────┬────────┘
         │ Mensaje: "Quiero Netflix Premium"
         ↓
┌─────────────────────────────────────┐
│   META CLOUD API (WhatsApp)         │
│   https://graph.facebook.com        │
└────────┬────────────────────────────┘
         │ Webhook POST
         ↓
┌─────────────────────────────────────┐
│   NGROK (Túnel)                     │
│   https://abc123.ngrok-free.app     │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│   TU SERVIDOR (backend/)            │
│   http://localhost:3001             │
│                                     │
│   ┌─────────────────────────────┐  │
│   │ whatsappController.js       │  │
│   │ ↓                           │  │
│   │ intentService.js            │  │
│   │ (Detecta: quiere comprar)   │  │
│   │ ↓                           │  │
│   │ geminiService.js (IA)       │  │
│   │ (Genera respuesta natural)  │  │
│   │ ↓                           │  │
│   │ whatsappService.js          │  │
│   │ (Envía respuesta)           │  │
│   └─────────────────────────────┘  │
└─────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│   RESPUESTA AL USUARIO              │
│   "Perfecto! Netflix Premium        │
│    por $38.900. Link de pago: ..."  │
└─────────────────────────────────────┘
```

---

## 🚀 INICIO RÁPIDO (3 PASOS)

### ⚡ PASO 1: Obtener Credenciales (15 min)

#### 1.1 Meta for Developers
```
1. Ir a: https://developers.facebook.com/
2. Crear App → Business
3. Agregar WhatsApp Product
4. Copiar:
   ✅ Access Token
   ✅ Phone Number ID
   ✅ Business Account ID
```

#### 1.2 Google Gemini
```
1. Ir a: https://aistudio.google.com/app/apikey
2. Create API Key
3. Copiar API Key
```

---

### ⚙️ PASO 2: Configurar Local (5 min)

#### 2.1 Crear archivo .env
```bash
cd backend
copy .env.example .env
notepad .env
```

#### 2.2 Completar credenciales
```env
WHATSAPP_API_TOKEN=EAACxxx...tu_token
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321
WHATSAPP_WEBHOOK_VERIFY_TOKEN=MiTokenSecreto123
GEMINI_API_KEY=AIza...tu_key
```

#### 2.3 Instalar dependencias
```bash
npm install
```

---

### 🌐 PASO 3: Exponer y Probar (10 min)

#### 3.1 Terminal 1 - Iniciar servidor
```bash
cd backend
npm start
```

Verás:
```
🚀 ============================================
   StreamFlow WhatsApp Bot Server
   ============================================
   🌐 Server running on: http://localhost:3001
```

#### 3.2 Terminal 2 - Iniciar ngrok
```bash
ngrok http 3001
```

Copia la URL: `https://abc123.ngrok-free.app`

#### 3.3 Configurar Webhook en Meta
```
1. Meta Dashboard → WhatsApp → Configuration
2. Edit Webhook:
   URL: https://abc123.ngrok-free.app/webhook
   Token: MiTokenSecreto123 (el que pusiste en .env)
3. Subscribe to: messages ✅
```

#### 3.4 ¡Probar desde tu celular!
```
1. Abre WhatsApp
2. Envía mensaje al número de WhatsApp Business
3. Escribe: "Hola"
4. ¡Deberías recibir respuesta! 🎉
```

---

## 💬 CONVERSACIÓN DE EJEMPLO

```
👤 Tú: Hola

🤖 Bot: Hola! Soy Vale, estudio psicología y vendo 
       estas cuentas para mis fotocopias 😊
       ¿Qué necesitas hoy?

👤 Tú: Cuánto cuesta Netflix?

🤖 Bot: Mira parce, tengo:
       📺 Móvil → $16.900
       📺 Estándar → $26.900
       📺 Premium (4K) → $38.900
       Cuál te sirve?

👤 Tú: Quiero el premium

🤖 Bot: Perfecto! Netflix Premium por $38.900 💫
       Te envío el link de pago de una

🤖 Bot: 💳 Link de Pago Seguro (Wompi)
       https://checkout.wompi.co/p/?public-key=...
       ✅ Tu cuenta se enviará cuando confirmes el pago
```

---

## 🔍 VERIFICACIÓN RÁPIDA

### ✅ Servidor funcionando
```bash
# En navegador:
http://localhost:3001/health

# Debería mostrar:
{"uptime": 123, "message": "OK", ...}
```

### ✅ Logs del servidor
Al recibir un mensaje deberías ver:
```
[INFO] 📩 New message received: {"from":"573001234567"}
[INFO] 💬 User message: "Hola"
[INFO] 🤖 AI Response generated
[INFO] ✅ Message processed successfully
```

### ✅ Ngrok funcionando
```bash
# En terminal de ngrok deberías ver:
GET  /webhook    200 OK
POST /webhook    200 OK
```

---

## 🐛 PROBLEMAS COMUNES

| Problema | Solución |
|----------|----------|
| ❌ Webhook no verifica | Revisa que el token en `.env` sea igual al de Meta |
| ❌ Bot no responde | Verifica que tu número esté en lista de prueba |
| ❌ Error de Gemini | Confirma que GEMINI_API_KEY sea correcta |
| ❌ Ngrok desconectado | Reinicia ngrok y actualiza URL en Meta |
| ❌ Node no encontrado | Instala Node.js desde https://nodejs.org |

---

## 📞 NÚMEROS IMPORTANTES

### Número de prueba de Meta
- **Válido por:** Desarrollo ilimitado
- **Limitación:** Solo 5 números de prueba
- **Costo:** Gratis

### Número propio
- **Requisito:** No estar en WhatsApp personal
- **Válido por:** 1000 conversaciones/mes gratis
- **Costo:** Gratis hasta cierto punto, luego desde $0.005/mensaje

### Conversaciones incluidas (gratis)
- 1000 conversaciones/mes
- Después: ~$0.03-$0.10 por conversación

---

## 🎯 PRÓXIMOS PASOS

Una vez funcione el bot:

### 1. Desplegar a producción
```bash
# Railway (recomendado)
railway login
railway init
railway up
```

### 2. Configurar webhooks de Wompi
Para envío automático de credenciales post-pago

### 3. Base de datos
Implementar inventario real de cuentas

### 4. Templates aprobados
Crear mensajes preaprobados por Meta

---

## 📚 RECURSOS

- [Docs WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Wompi Docs](https://docs.wompi.co/)
- [Ngrok Docs](https://ngrok.com/docs)

---

## ✨ TIPS PRO

### 💾 Mantener conversaciones
El bot ya guarda historial en caché (1 hora)

### 🎭 Personalizar personalidad
Edita `backend/services/geminiService.js` → `SYSTEM_PROMPT`

### 📊 Ver analytics
Próximamente: dashboard con métricas

### 🔄 Auto-restart
Usa PM2 en producción:
```bash
npm install -g pm2
pm2 start server.js --name whatsapp-bot
pm2 save
```

---

¡Listo para vender! 🚀
