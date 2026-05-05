# StreamFlow WhatsApp Bot

Bot de WhatsApp con IA para venta automatizada de cuentas de streaming (Netflix, Max). Responde clientes, genera links de pago y entrega credenciales automáticamente al confirmar el pago.

**Producción:** `https://botwhatsappnetflix-production.up.railway.app`
**Repo:** `https://github.com/Pablo-app-developer/Bot_whatsapp_netflix`

---

## Flujo completo

```
Cliente escribe "Hola"
    ↓
Valeria (IA) saluda y ofrece catálogo
    ↓
Cliente: "quiero Netflix Premium"
    ↓
Bot detecta intención → crea Orden → envía link Wompi
    ↓
Cliente paga
    ↓
Wompi → POST /webhook/wompi
    ↓
Bot asigna cuenta disponible → envía credenciales por WhatsApp ✅
```

---

## Stack

- **Runtime:** Node.js 24 + Express
- **IA:** Groq API — llama-3.1-8b-instant (14,400 req/día gratis)
- **WhatsApp:** Meta Cloud API
- **Pagos:** Wompi (Colombia)
- **Base de datos:** JSON files (`data/`)
- **Hosting:** Railway

---

## Estructura

```
backend/
├── server.js
├── controllers/
│   └── whatsappController.js     # Recibe mensajes y webhook Wompi
├── routes/
│   └── whatsapp.js               # GET/POST /webhook, POST /webhook/wompi
├── services/
│   ├── geminiService.js          # IA con Groq (bot "Valeria")
│   ├── whatsappService.js        # Envío de mensajes
│   ├── intentService.js          # Detección de intención de compra
│   ├── paymentService.js         # Links de pago Wompi
│   ├── inventoryService.js       # Gestión de cuentas de streaming
│   ├── orderService.js           # Órdenes y clientes
│   ├── credentialService.js      # Entrega automática post-pago
│   ├── adminService.js           # Panel admin por WhatsApp
│   └── dbService.js              # Lectura/escritura JSON files
├── data/
│   ├── accounts.json             # Inventario de cuentas
│   ├── orders.json               # Órdenes de compra
│   └── clients.json              # Clientes activos
└── utils/
    ├── logger.js
    └── cache.js
```

---

## Variables de entorno

```env
WHATSAPP_API_TOKEN=               # Token permanente de System User (Meta)
WHATSAPP_PHONE_NUMBER_ID=         # ID del número de WhatsApp Business
WHATSAPP_BUSINESS_ACCOUNT_ID=     # ID de la cuenta Business
WHATSAPP_WEBHOOK_VERIFY_TOKEN=    # Token de verificación del webhook

GROQ_API_KEY=                     # API key de Groq (gratis en console.groq.com)

WOMPI_PUBLIC_KEY=                 # Llave pública Wompi
WOMPI_PRIVATE_KEY=                # Llave privada Wompi

ADMIN_PHONE=57XXXXXXXXXX          # Tu número (con código de país, sin +)
ADMIN_KEY=!admin                  # Prefijo para comandos de admin

PORT=3001
NODE_ENV=production
BASE_URL=https://botwhatsappnetflix-production.up.railway.app
```

---

## Panel de administrador

Envía estos comandos desde tu WhatsApp (número configurado en `ADMIN_PHONE`):

| Comando | Descripción |
|---------|-------------|
| `!admin agregar netflix premium email pass Perfil 1234` | Agregar cuenta al inventario |
| `!admin disponibles` | Ver stock por plan |
| `!admin listar` | Ver todas las cuentas |
| `!admin stats` | Resumen del negocio |
| `!admin clientes activos` | Lista de clientes |
| `!admin cliente 573001234567` | Datos de un cliente |
| `!admin ordenes pending` | Órdenes pendientes |
| `!admin liberar <id>` | Liberar cuenta asignada |
| `!admin ayuda` | Ver todos los comandos |

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado del servidor |
| GET | `/webhook` | Verificación webhook Meta |
| POST | `/webhook` | Recepción de mensajes WhatsApp |
| POST | `/webhook/wompi` | Confirmación de pagos Wompi |

---

## Configuración inicial (paso a paso)

### 1. Groq API Key (gratis)
1. Crear cuenta en `https://console.groq.com`
2. API Keys → Create API Key
3. Copiar la clave (`gsk_...`)

### 2. WhatsApp Cloud API (Meta)
1. Crear app en `https://developers.facebook.com/apps/`
2. Agregar producto WhatsApp
3. Copiar: Access Token, Phone Number ID, Business Account ID
4. **Token permanente:** Business Settings → System Users → crear admin → asignar app → Generate Token (expiración: Nunca)

### 3. Webhook Meta
1. WhatsApp → Configuración de la API → Webhook → Editar
2. URL: `https://TU-URL.up.railway.app/webhook`
3. Token: el valor de `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
4. Suscribir campo `messages`
5. Activar suscripción WABA vía API:
   ```
   POST https://graph.facebook.com/v18.0/{WABA_ID}/subscribed_apps
   Authorization: Bearer {TOKEN}
   ```

### 4. Deploy en Railway
1. Push código a GitHub
2. Railway → New Project → Deploy from GitHub
3. Configurar variables de entorno
4. Railway genera URL pública automáticamente

---

## Catálogo de precios

| Servicio | Plan | Precio COP |
|----------|------|-----------|
| Netflix | Móvil | $16.900 |
| Netflix | Estándar | $26.900 |
| Netflix | Premium | $38.900 |
| Max | Estándar | $19.900 |
| Max | Platino | $29.900 |

---

## Pendiente

- [ ] Configurar webhook de Wompi para entrega automática de credenciales
- [ ] Pasar Wompi a modo producción
- [ ] Agregar cuentas reales con `!admin agregar`
- [ ] Migrar base de datos de JSON a PostgreSQL para mayor escala
