# 🚀 CHECKLIST DE CONFIGURACIÓN WHATSAPP

Usa este checklist para verificar que todo esté configurado correctamente.

---

## ✅ PASO 1: Requisitos Previos

- [ ] Node.js instalado (v18 o superior)
- [ ] Cuenta de Facebook/Meta activa
- [ ] Número de teléfono disponible (sin WhatsApp personal activo)
- [ ] Tarjeta de crédito para verificación Meta (no se cobra)

---

## ✅ PASO 2: Meta for Developers

- [ ] Cuenta creada en https://developers.facebook.com/
- [ ] App creada (tipo: Business o Otro)
- [ ] WhatsApp Product agregado a la app
- [ ] Business Portfolio configurado

---

## ✅ PASO 3: Configuración de WhatsApp

- [ ] Número de prueba obtenido (o número propio agregado)
- [ ] Access Token copiado (temp o permanente)
- [ ] Phone Number ID copiado
- [ ] Business Account ID copiado
- [ ] Tu celular agregado a la lista de teléfonos de prueba

---

## ✅ PASO 4: Google Gemini API

- [ ] Cuenta de Google Cloud
- [ ] API Key generada en https://aistudio.google.com/app/apikey
- [ ] API Key copiada y guardada

---

## ✅ PASO 5: Configuración Local

- [ ] Archivo `backend/.env` creado
- [ ] Variables completadas en `.env`:
  - [ ] `WHATSAPP_API_TOKEN`
  - [ ] `WHATSAPP_PHONE_NUMBER_ID`
  - [ ] `WHATSAPP_BUSINESS_ACCOUNT_ID`
  - [ ] `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (inventa uno secreto)
  - [ ] `GEMINI_API_KEY`
- [ ] Dependencias instaladas: `npm install` en `backend/`

---

## ✅ PASO 6: Servidor y Ngrok

- [ ] Servidor corriendo: `npm start` en `backend/`
- [ ] Ngrok descargado de https://ngrok.com/download
- [ ] Cuenta de ngrok creada
- [ ] Ngrok autenticado: `ngrok config add-authtoken TU_TOKEN`
- [ ] Ngrok corriendo: `ngrok http 3001`
- [ ] URL de ngrok copiada (ej: `https://abc123.ngrok-free.app`)

---

## ✅ PASO 7: Webhook en Meta

- [ ] Webhook configurado en Meta Dashboard
  - [ ] Callback URL: `https://TU-NGROK-URL.ngrok-free.app/webhook`
  - [ ] Verify Token: el mismo de `.env`
  - [ ] Estado: "Verified" ✅
- [ ] Suscripción a eventos:
  - [ ] `messages` activado
  - [ ] `message_status` activado (opcional)

---

## ✅ PASO 8: Primera Prueba

- [ ] Servidor backend corriendo sin errores
- [ ] Ngrok corriendo y mostrando túnel activo
- [ ] Health check OK: http://localhost:3001/health
- [ ] Mensaje enviado desde tu celular al número de WhatsApp Business
- [ ] **¡Respuesta recibida del bot!** 🎉

---

## ✅ PASO 9: Prueba de Compra

- [ ] Mensaje enviado: "Hola"
- [ ] Bot responde con saludo
- [ ] Mensaje enviado: "Cuánto cuesta Netflix?"
- [ ] Bot responde con precios
- [ ] Mensaje enviado: "Quiero Netflix Premium"
- [ ] Bot confirma y envía link de pago
- [ ] Link de Wompi recibido

---

## 🐛 TROUBLESHOOTING

Si algo no funciona, verifica:

### Webhook no se verifica
- [ ] Token en `.env` es exacto al de Meta
- [ ] Ngrok está corriendo
- [ ] URL de ngrok correcta en Meta
- [ ] Servidor corriendo sin errores

### Bot no responde
- [ ] Logs del servidor muestran mensaje recibido
- [ ] Tu número está en lista de prueba
- [ ] Webhook suscrito a `messages`
- [ ] GEMINI_API_KEY es válida

### Error de Gemini
- [ ] API Key correcta
- [ ] Créditos disponibles en Google Cloud
- [ ] Internet funcionando

---

## 📝 NOTAS

**URLs Importantes:**
- Meta Dashboard: https://developers.facebook.com/apps/
- Gemini API Keys: https://aistudio.google.com/app/apikey
- Ngrok Dashboard: https://dashboard.ngrok.com/

**Comandos Rápidos:**
```bash
# Iniciar servidor
cd backend && npm start

# Iniciar ngrok (otra terminal)
ngrok http 3001

# Ver logs en tiempo real
# (ya los ves en la terminal del servidor)

# Verificar salud del servidor
curl http://localhost:3001/health
```

---

## 🎉 ¡Felicidades!

Si completaste todos los pasos, tienes un chatbot de WhatsApp funcionando.

**Próximos pasos:**
1. Desplegar a producción (Railway, Heroku)
2. Conectar base de datos real
3. Configurar webhooks de Wompi
4. Crear templates de WhatsApp aprobados
