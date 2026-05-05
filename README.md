# StreamFlow WhatsApp Bot - Backend

Backend del chatbot de WhatsApp con IA para venta de cuentas de streaming.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales

# Iniciar servidor
npm start
```

## 📋 Requisitos

- Node.js 18+
- Cuenta de Meta for Developers
- API Key de Google Gemini
- Número de WhatsApp Business

## 📁 Estructura del Proyecto

```
backend/
├── server.js                  # Servidor Express principal
├── routes/
│   └── whatsapp.js           # Rutas del webhook
├── controllers/
│   └── whatsappController.js # Lógica de mensajes
├── services/
│   ├── whatsappService.js    # API de WhatsApp
│   ├── geminiService.js      # IA con Gemini
│   ├── intentService.js      # Detección de intenciones
│   └── paymentService.js     # Integración Wompi
└── utils/
    ├── logger.js             # Sistema de logs
    └── cache.js              # Caché de conversaciones
```

## 🔧 Configuración

Ver [WHATSAPP_SETUP.md](./WHATSAPP_SETUP.md) para guía completa de configuración.

## 🧪 Testing

```bash
# Verificar que el servidor funciona
curl http://localhost:3001/health

# Probar webhook
curl http://localhost:3001/webhook/test
```

## 📱 Funcionalidades

- ✅ Recepción de mensajes de WhatsApp
- ✅ Respuestas con IA (Gemini)
- ✅ Detección de intención de compra
- ✅ Generación de links de pago (Wompi)
- ✅ Caché de conversaciones
- ✅ Logs estructurados
- ⏳ Envío automático de credenciales (próximamente)
- ⏳ Base de datos de inventario (próximamente)

## 🌟 Características del Bot

**Personalidad:** Valeria - Vendedora universitaria colombiana
**Tono:** Informal, amigable, cercana
**Servicios:** Netflix, Max (HBO)
**Pagos:** Wompi (tarjeta, Nequi, Daviplata)

## 📊 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Info del servicio |
| GET | `/health` | Estado del servidor |
| GET | `/webhook` | Verificación webhook |
| POST | `/webhook` | Recepción de mensajes |

## ⚠️ Variables de Entorno Requeridas

```env
WHATSAPP_API_TOKEN=         # Token de Meta
WHATSAPP_PHONE_NUMBER_ID=   # ID del número
WHATSAPP_WEBHOOK_VERIFY_TOKEN= # Token de verificación
GEMINI_API_KEY=             # API key de Gemini
```

## 🚀 Despliegue

### Railway
```bash
railway init
railway up
```

### Heroku
```bash
heroku create
git push heroku main
```

## 📝 Licencia

MIT
