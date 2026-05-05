# 📱 GUÍA COMPLETA: Configurar WhatsApp Business API

Esta guía te llevará paso a paso para configurar tu chatbot de WhatsApp y hacer pruebas desde tu celular.

---

## 🎯 RESUMEN RÁPIDO

Para tener tu bot funcionando necesitas:
1. ✅ **Cuenta de Meta for Developers** (gratis)
2. ✅ **Número de teléfono** para WhatsApp Business (puede ser el tuyo)
3. ✅ **Servidor expuesto a internet** (ngrok o servidor real)
4. ✅ **API Key de Gemini** (gratis)

**Tiempo estimado:** 30-45 minutos

---

## 📋 PASO 1: Configurar Meta for Developers

### 1.1 Crear cuenta de Meta for Developers
1. Ve a: https://developers.facebook.com/
2. Haz clic en **"Get Started"** o **"Comenzar"**
3. Inicia sesión con tu cuenta de Facebook
4. Completa la verificación de tu identidad si te la piden

### 1.2 Crear una App
1. En el dashboard, haz clic en **"Create App"** / **"Crear aplicación"**
2. Selecciona tipo: **"Business"** o **"Otro"**
3. Información de la app:
   - **App Name:** `StreamFlow Bot`
   - **Contact Email:** tu email
4. Haz clic en **"Create App"**

### 1.3 Agregar WhatsApp Business
1. En tu app, busca **"WhatsApp"** en la lista de productos
2. Haz clic en **"Set Up"** / **"Configurar"**
3. Sigue el asistente de configuración:
   - Selecciona **Business Portfolio** (o crea uno nuevo)
   - Acepta los términos de servicio

---

## 📞 PASO 2: Configurar Número de WhatsApp

### 2.1 Agregar número de teléfono
Meta te da un **número de prueba** automáticamente, pero para producción necesitas tu propio número.

#### Opción A: Usar número de prueba (para desarrollo)
- Ya está listo, no necesitas configurar nada
- **Limitación:** Solo puedes enviar mensajes a 5 números que agregues manualmente

#### Opción B: Usar tu propio número (recomendado)
1. Ve a **API Setup** > **Phone Numbers**
2. Haz clic en **"Add phone number"**
3. Ingresa tu número de celular
4. **IMPORTANTE:** Este número NO puede estar registrado en WhatsApp normal
   - Si ya lo usas, tendrás que desactivar tu cuenta personal primero
5. Verificarás el número con un código SMS

### 2.2 Obtener Access Token
1. En **API Setup**, busca la sección **"Temporary access token"**
2. Copia el token (empieza con `EAAC...`)
3. **⚠️ IMPORTANTE:** Este token expira en 24 horas
4. Para tokens permanentes:
   - Ve a **Settings** > **Business Settings** > **System Users**
   - Crea un System User y genera un token permanente

### 2.3 Obtener Phone Number ID
1. En **API Setup**, busca **"From"** en la sección de prueba
2. Copia el **Phone Number ID** (número largo como `123456789012345`)

---

## 🌐 PASO 3: Exponer tu servidor a Internet

Tu servidor debe ser accesible desde internet para que Meta pueda enviar los mensajes.

### Opción A: Usar ngrok (RECOMENDADO para pruebas)

#### Instalar ngrok
1. Descarga desde: https://ngrok.com/download
2. Descomprime y mueve `ngrok.exe` a tu carpeta del proyecto
3. Crea cuenta gratis en ngrok.com
4. Copia tu auth token desde: https://dashboard.ngrok.com/get-started/your-authtoken

#### Configurar ngrok
```powershell
# En tu carpeta del proyecto
.\ngrok config add-authtoken TU_AUTH_TOKEN_AQUI
```

#### Iniciar ngrok (lo harás después de iniciar el servidor)
```powershell
.\ngrok http 3001
```

Esto te dará una URL pública como: `https://abc123.ngrok.io`

### Opción B: Servidor real (para producción)
- Despliega en Heroku, Railway, DigitalOcean, etc.
- Necesitas HTTPS (certificado SSL)

---

## 🔑 PASO 4: Obtener API Key de Gemini

1. Ve a: https://aistudio.google.com/app/apikey
2. Haz clic en **"Create API key"**
3. Selecciona tu proyecto de Google Cloud (o crea uno nuevo - gratis)
4. Copia la API key que empieza con `AIza...`

---

## ⚙️ PASO 5: Configurar el Backend

### 5.1 Crear archivo .env
```powershell
# En la carpeta backend/
cd backend
cp .env.example .env
```

### 5.2 Editar .env con tus credenciales
Abre `backend/.env` y completa:

```env
# WhatsApp Config
WHATSAPP_API_TOKEN=EAAC...tu_token_completo
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=tu_business_account_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=mi_secreto_super_seguro_12345

# Gemini AI
GEMINI_API_KEY=AIza...tu_api_key

# Server
PORT=3001
NODE_ENV=development
BASE_URL=https://streamflow.com
```

**Notas importantes:**
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`: Ponle CUALQUIER texto secreto, lo usarás más adelante
- `BASE_URL`: Por ahora déjalo así, se actualizará cuando tengas dominio

### 5.3 Instalar dependencias
```powershell
# En la carpeta backend/
npm install
```

### 5.4 Iniciar el servidor
```powershell
npm start
```

Deberías ver:
```
🚀 ============================================
   StreamFlow WhatsApp Bot Server
   ============================================
   🌐 Server running on: http://localhost:3001
   ...
```

---

## 🔗 PASO 6: Configurar Webhook en Meta

### 6.1 Exponer servidor con ngrok
En otra terminal (mientras el servidor sigue corriendo):
```powershell
.\ngrok http 3001
```

Copia la URL que te da, ejemplo: `https://abc123.ngrok-free.app`

### 6.2 Configurar webhook en Meta
1. Ve a tu app en Meta for Developers
2. WhatsApp > **Configuration** / **Configuración**
3. En **Webhook**, haz clic en **"Configure"** / **"Configurar"**
4. Ingresa:
   - **Callback URL:** `https://abc123.ngrok-free.app/webhook`
   - **Verify Token:** El mismo que pusiste en `.env` (ejemplo: `mi_secreto_super_seguro_12345`)
5. Haz clic en **"Verify and Save"**

Si todo está bien, verás ✅ **"Verified"**

### 6.3 Suscribirse a eventos
1. Debajo del webhook, busca **Webhook fields**
2. Haz clic en **"Manage"** / **"Administrar"**
3. Activa:
   - ✅ **messages** (requerido)
   - ✅ **message_status** (opcional pero recomendado)
4. Guarda cambios

---

## 📱 PASO 7: PROBAR DESDE TU CELULAR

### 7.1 Agregar tu número a la lista de prueba
Si usas el número de prueba de Meta:

1. En Meta Dashboard > WhatsApp > **API Setup**
2. Busca **"To"** o **"Add recipient phone number"**
3. Agrega tu número de celular con código de país: `+57 300 123 4567`
4. Recibirás un código por WhatsApp, ingrésalo

### 7.2 Iniciar conversación
1. Desde tu celular, abre WhatsApp
2. Crea un chat nuevo con el número de WhatsApp Business que configuraste
3. **Primer mensaje:** Debes iniciarlo TÚ (Meta no permite que el bot inicie)
4. Escribe: `Hola`

### 7.3 ¡Deberías recibir respuesta de Valeria! 🎉

Si todo está bien, recibirás algo como:
```
Hola! Soy Vale, estudio psicología y vendo estas cuentas para mis fotocopias 😊
¿Qué necesitas hoy? Tengo Netflix y Max súper bien de precio!
```

---

## 🧪 PASO 8: Probar el flujo de compra

### Prueba 1: Preguntar por servicios
```
Tú: Cuánto cuesta Netflix?
Bot: [Te responde con los planes y precios]
```

### Prueba 2: Intentar comprar
```
Tú: Quiero Netflix Premium
Bot: Perfecto! Netflix Premium por $38.900 COP. Te envío el link de pago de una 💫
Bot: [Envía link de pago Wompi]
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### ❌ Webhook no se verifica
- Revisa que el `WHATSAPP_WEBHOOK_VERIFY_TOKEN` en `.env` sea EXACTAMENTE igual al que pusiste en Meta
- Verifica que ngrok esté corriendo
- Mira los logs del servidor para ver qué recibe

### ❌ No responde a mensajes
- Verifica que el servidor esté corriendo (`npm start`)
- Mira los logs del servidor: deberías ver `📩 New message received`
- Verifica que el webhook esté suscrito a `messages`
- Confirma que tu número esté en la lista de prueba

### ❌ Error de Gemini API
- Verifica que `GEMINI_API_KEY` esté correcta
- Ve a https://aistudio.google.com/app/apikey y confirma que esté activa
- Revisa que tengas créditos disponibles (Gemini tiene tier gratis)

### ❌ ngrok se desconecta
- ngrok gratis cierra después de 2 horas, reinícialo
- Cada vez que reinicias ngrok cambia la URL, actualízala en Meta
- Considera usar un servidor permanente para producción

---

## 🚀 DESPLIEGUE A PRODUCCIÓN

### Opciones recomendadas:

#### 1. Railway.app (Recomendado - Más fácil)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### 2. Heroku
```bash
heroku create streamflow-bot
git push heroku main
```

#### 3. VPS (DigitalOcean, Linode)
- Instala Node.js
- Usa PM2 para mantener el proceso vivo
- Configura nginx + certbot para HTTPS

---

## 📊 MONITOREO

### Ver logs en tiempo real
```powershell
# Tu terminal mostrará:
[INFO] 📩 New message received: {"from":"573001234567", ...}
[INFO] 💬 User message: "Hola"
[INFO] 🤖 AI Response generated
[INFO] ✅ Message processed successfully
```

### Verificar estado del servidor
```
http://localhost:3001/health
```

---

## 🔐 SEGURIDAD IMPORTANTE

### ❌ NUNCA subas a GitHub:
- `.env` (tus tokens y claves)
- Credenciales de cualquier tipo

### ✅ SIEMPRE:
- Usa `.env` para secretos
- Agrega `.env` al `.gitignore` (ya está)
- Usa tokens de sistema permanentes (no temporales)
- Habilita 2FA en Meta/Facebook

---

## 💡 PRÓXIMOS PASOS

Una vez funcione:

1. **Conectar base de datos real:**
   - PostgreSQL o MongoDB
   - Inventario de cuentas
   - Historial de ventas

2. **Integrar webhooks de Wompi:**
   - Confirmar pagos automáticamente
   - Enviar credenciales tras pago

3. **Mensajes con templates:**
   - Crea templates aprobados por Meta
   - Envía mensajes proactivos (con limitaciones)

4. **Analytics:**
   - Tasa de conversión
   - Mensajes por día
   - Servicios más vendidos

---

## 📞 SOPORTE

Si necesitas ayuda:
1. Revisa los logs del servidor
2. Verifica la configuración en Meta Dashboard
3. Consulta la documentación oficial: https://developers.facebook.com/docs/whatsapp

---

¡Listo! Ahora tienes un chatbot de WhatsApp completamente funcional 🎉
