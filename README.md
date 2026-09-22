# Formación Para Todos — Bot WhatsApp

Bot de WhatsApp con IA para vender una biblioteca digital de **434 libros técnicos** (IA/ML, Datos, DevOps, Cloud, Seguridad, etc.). La IA se llama **Valeria** y hace toda la venta: navega el catálogo, propone libros y cierra la compra.

Cada libro cuesta **$10.000 COP**. Al confirmar el pago se entrega automáticamente por WhatsApp con un link de Google Drive con el material.

---

## Stack

- **Runtime:** Node.js 24 + Express
- **IA:** Groq API — modelo `openai/gpt-oss-20b` (con function calling / tool use)
- **Mensajería:** WhatsApp Cloud API (Meta)
- **Pagos:** Mercado Pago (Checkout Pro / API de Preferences)
- **Hosting:** Railway (auto-deploy en push a `main`)
- **DB:** JSON files (`data/catalog.json`, `data/orders.json`, `data/clients.json`)

---

## Infraestructura de producción

| Servicio | Detalle |
|---|---|
| URL Railway | `https://botwhatsappnetflix-production.up.railway.app` |
| GitHub | `https://github.com/Pablo-app-developer/Bot_whatsapp_netflix` |
| Dominio | `formacionparatodos.online` |
| Número WhatsApp | `+57 318 9277573` |
| Phone Number ID | `1143854128805185` |
| WABA ID | `4296970973856614` |
| Webhook WA | `.../webhook` — token: `streamflow_token_2024` |
| Webhook MP | `.../mp-webhook` (configurar en panel de MP) |

---

## Variables de entorno (Railway)

```
WHATSAPP_API_TOKEN              → token permanente de System User (no expira)
WHATSAPP_PHONE_NUMBER_ID        → 1143854128805185
WHATSAPP_BUSINESS_ACCOUNT_ID    → 4296970973856614
WHATSAPP_WEBHOOK_VERIFY_TOKEN   → streamflow_token_2024
GROQ_API_KEY                    → empieza con gsk_
MP_ACCESS_TOKEN                 → APP_USR-... (credenciales MP)
MP_MODE                         → sandbox | production
MP_NOTIFICATION_URL             → (opcional) URL del webhook MP si lo defines por env
ADMIN_PHONE                     → 573214498647
ADMIN_KEY                       → !admin
BASE_URL                        → https://botwhatsappnetflix-production.up.railway.app
NODE_ENV                        → production
```

---

## Catálogo — `data/catalog.json`

Fuente original: Google Sheets (mantenido por el dueño). Se sincroniza manualmente por ahora.

**434 libros, 17 categorías** (top 5 por volumen):

| Libros | Categoría |
|-------:|-----------|
| 100 | IA y Machine Learning |
| 84 | Datos y Analítica |
| 47 | Programación y Lenguajes |
| 37 | DevOps y SRE |
| 33 | Seguridad y Ciberseguridad |

Cada entrada: `{ id, category, title, url }`. El `url` apunta a la carpeta de Drive con el material.

---

## Arquitectura

```
WhatsApp usuario
      ↓
Meta Cloud API
      ↓
POST /webhook  (Railway)
      ↓
whatsappController.js
      ├── isAdminCommand? → adminService.js
      └── getAIResponse → geminiService.js (Groq + tools)
              │
              ├── tool: list_books(category)   → catalogService.listBooksByCategory
              ├── tool: search_books(query)    → catalogService.searchBooks
              └── tool: send_payment_link(id)  → devuelve { text, action }
                          │
                          ↓
                    getPaymentLink → paymentService.js (MP Checkout Pro)
                    createOrder    → orderService.js  (guarda bookId)

MP pago aprobado
      ↓
POST /mp-webhook
      ↓
handleMPWebhook → deliverBook → sendWhatsAppMessage (link de Drive)
```

**Ventaja del function calling:** el LLM decide por contexto cuándo mostrar categorías, cuándo buscar y cuándo enviar el link. No hay regex de intent.

---

## Comandos admin (desde WhatsApp del admin)

```
!admin ordenes [pending|approved]
!admin clientes
!admin cliente <número>
!admin stats
```

*(Los comandos de inventario de cuentas quedaron del sistema anterior; ya no aplican para libros.)*

---

## Flujo de deploy

1. Editar código localmente en carpeta `backend/`
2. `git add . && git commit -m "..."` y `git push origin main`
3. Railway hace redeploy automático en ~2 minutos

---

## Actualizar el catálogo

El catálogo vive en `data/catalog.json`. Si el sheet cambia:

1. Descargar el sheet actualizado (o exportarlo)
2. Regenerar `catalog.json` con un script sencillo (ver `services/catalogService.js` para el formato esperado)
3. Commit + push → Railway recarga en el próximo request (el catálogo se lee en memoria la primera vez)

Un script de sync automático desde el sheet es un pendiente.

---

## Fixes críticos aprendidos

- **GROQ_API_KEY** en Railway debe empezar con `gsk_`. Si la IA falla solo en producción, verificar primero.
- **WHATSAPP_API_TOKEN** debe ser token permanente de System User (Business Manager → Usuarios del sistema). Los del App Dashboard expiran en 24h.
- **WABA suscripción** se activa vía `POST /v21.0/{wabaId}/subscribed_apps`. La UI de Meta no lo hace sola.
- **MP `notification_url`** puede fallar con subdominios `*.up.railway.app` (error `invalid_notification_url`). Actualmente lo dejamos opcional (`MP_NOTIFICATION_URL`) y configuramos el webhook desde el panel de MP.
- **`gpt-oss-20b` de Groq** usa formato Harmony y a veces expone `msg.reasoning` (chain-of-thought). **Nunca** enviar ese campo al usuario; solo `msg.content`.

---

## Pendiente

- Sync automático del catálogo desde el Google Sheet (cron o webhook)
- Configurar webhook de MP en el panel apuntando a `/mp-webhook` para entrega automática tras pago aprobado
- Pasar MP a modo producción (`MP_MODE=production` + token productivo) cuando haya ventas reales
- Limpiar comandos admin heredados del proyecto anterior
