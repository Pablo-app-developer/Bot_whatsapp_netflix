# StreamFlow WhatsApp Bot — Documentación completa

Bot de WhatsApp con IA para venta de cursos online. La IA se llama **Valeria**, una chica colombiana de 24 años que vende cursos que ella misma creó.

---

## Stack

- **Runtime:** Node.js 24 + Express
- **IA:** Groq API — modelo `llama-3.1-8b-instant`
- **Mensajería:** WhatsApp Cloud API (Meta)
- **Pagos:** Wompi (modo test actualmente)
- **Hosting:** Railway (auto-deploy desde GitHub)
- **DB:** JSON files (`data/accounts.json`, `orders.json`, `clients.json`)

---

## Infraestructura de producción

| Servicio | Detalle |
|---|---|
| URL Railway | `https://botwhatsappnetflix-production.up.railway.app` |
| GitHub | `https://github.com/Pablo-app-developer/Bot_whatsapp_netflix` |
| Número WhatsApp | `+57 318 9277573` |
| Phone Number ID | `1143854128805185` |
| WABA ID | `4296970973856614` |
| Webhook URL | `https://botwhatsappnetflix-production.up.railway.app/webhook` |
| Webhook token | `streamflow_token_2024` |

---

## Variables de entorno (Railway)

```
WHATSAPP_API_TOKEN        → token permanente de System User (no expira)
WHATSAPP_PHONE_NUMBER_ID  → 1143854128805185
WHATSAPP_BUSINESS_ACCOUNT_ID → 4296970973856614
WHATSAPP_WEBHOOK_VERIFY_TOKEN → streamflow_token_2024
GROQ_API_KEY              → empieza con gsk_...
WOMPI_PUBLIC_KEY          → pub_test_... (modo test)
ADMIN_PHONE               → 573214498647
ADMIN_KEY                 → !admin
PORT                      → (Railway lo asigna automáticamente)
NODE_ENV                  → production
BASE_URL                  → https://botwhatsappnetflix-production.up.railway.app
```

---

## Catálogo de cursos (todos a $10.000 COP)

| Curso | Keywords detectadas |
|---|---|
| Redes Sociales que Venden | redes, contenido, instagram, tiktok |
| Finanzas Personales desde Cero | finanzas, plata, ahorrar, invertir |
| Canva Pro en 1 Hora | canva, diseño |
| Copywriting para WhatsApp | copywriting, copy, mensajes |
| Productividad Real | productividad, rendir, tiempo |
| Django desde Cero | django, python, web, programacion |
| Hacking Ético | hacking, ciberseguridad, seguridad |
| Excel que Sí Usas | excel, formulas, tablas |

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
      ├── extractPurchaseIntent → intentService.js
      ├── getAIResponse → geminiService.js (Groq)
      └── hasPurchaseIntent?
              ├── getPaymentLink → paymentService.js (Wompi)
              └── createOrder → orderService.js

Wompi pago aprobado
      ↓
POST /webhook/wompi
      ↓
deliverCredentials → credentialService.js
      ↓
sendWhatsAppMessage → cliente recibe acceso
```

---

## Comandos admin (desde WhatsApp del número admin)

```
!admin agregar <svc> <plan> <email> <pass> [perfil] [pin]
!admin listar [svc] [plan]
!admin disponibles
!admin stats
!admin ordenes [pending|approved]
!admin clientes [activos]
!admin cliente <número>
!admin liberar <id>
```

---

## Flujo de deploy

1. Editar código localmente en carpeta `backend/`
2. `git add .`
3. `git commit -m "descripción"`
4. `git push origin main`
5. Railway hace redeploy automático en ~2 minutos

---

## Fixes críticos aprendidos

- **GROQ_API_KEY en Railway:** debe empezar con `gsk_`. Si la IA falla solo en producción, verificar este valor primero.
- **WHATSAPP_API_TOKEN:** usar token permanente de System User (Business Manager → Usuarios del sistema). El token temporal del App Dashboard expira en 24h.
- **WABA suscripción:** se activa vía `POST /v21.0/{wabaId}/subscribed_apps` — la UI de Meta no lo hace sola.
- **Webhook Meta:** debe apuntar a Railway, no a ngrok. Ngrok solo para desarrollo local.
- El número `+57 318 9277573` tiene WABA ID `4296970973856614`, distinto al número de prueba original.

---

## Pendiente

- Configurar webhook de Wompi para entrega automática de credenciales
- Agregar links/accesos reales de los cursos en `credentialService.js`
- Pasar Wompi a modo producción cuando haya ventas reales
- Finalizar catálogo con los cursos reales del usuario
