# Quick Start

Guía práctica para trabajar con este bot. Para arquitectura completa ver `README.md`.

---

## Correr en local

```bash
cd backend
npm install
cp .env.example .env   # y completa las variables
npm start
```

El servidor arranca en `http://localhost:3001`. Endpoints útiles:

- `GET /health` → status + variables detectadas
- `GET /webhook` → verificación Meta (usa `WHATSAPP_WEBHOOK_VERIFY_TOKEN`)
- `POST /webhook` → mensajes entrantes de WhatsApp
- `POST /mp-webhook` → notificaciones de Mercado Pago

Para probar con WhatsApp real necesitas exponer el puerto (ngrok, o directamente Railway).

---

## Estructura del proyecto

```
backend/
├── server.js                        → Express app + rutas
├── data/
│   ├── catalog.json                 → 434 libros (categoría, título, url Drive)
│   ├── orders.json                  → órdenes de compra
│   └── clients.json                 → clientes
├── controllers/
│   └── whatsappController.js        → handler principal /webhook
└── services/
    ├── geminiService.js             → IA Valeria (Groq + function calling)
    ├── catalogService.js            → listCategories / listBooksByCategory / searchBooks
    ├── paymentService.js            → Mercado Pago (Checkout Pro)
    ├── credentialService.js         → deliverBook (envía link Drive tras pago)
    ├── orderService.js              → CRUD de órdenes
    ├── whatsappService.js           → envío + mark-as-read via Meta API
    └── adminService.js              → comandos !admin
```

---

## Cómo agregar/quitar libros

Editar `data/catalog.json` a mano o regenerar desde el Google Sheet. Formato:

```json
{
  "id": 1,
  "category": "Arquitectura de Software",
  "title": "Aprendizaje de estilos de API",
  "url": "https://drive.google.com/drive/folders/..."
}
```

Los `id` deben ser únicos y estables (el LLM los usa para llamar `send_payment_link`).

---

## Cómo cambiar la personalidad / prompt de Valeria

Editar el `buildSystemPrompt()` en `services/geminiService.js`. Ese archivo también define las 3 tools que el modelo puede llamar. Si cambias los nombres/parámetros de las tools, actualiza también el `executeTool()` y el prompt.

---

## Flujo de conversación (function calling)

```
Cliente: hola
  → LLM responde texto con categorías top

Cliente: quiero uno de kubernetes
  → LLM llama tool search_books("kubernetes")
  → catalogService devuelve top 8 títulos
  → LLM responde con la lista numerada

Cliente: el 2
  → LLM llama tool send_payment_link(book_id)
  → controller genera link MP y lo envía

[cliente paga → POST /mp-webhook]
  → paymentService.handleMPWebhook
  → deliverBook envía el link de Drive al WhatsApp del cliente
```

Máximo 3 vueltas de tool-use por mensaje (definido en `geminiService.js`).

---

## Deploy

Push a `main` → Railway redespliega solo en ~2 min.

```bash
git add .
git commit -m "descripción"
git push origin main
```

Ver logs en Railway → project → deployment → **View Logs**. Buscar:
- `📩 Message from ...` → mensaje entrante
- `🛠️ Tool call: ...`   → LLM invocó una tool
- `🤖 AI Response: ...` → respuesta final al usuario
- `📡 MP API response`  → llamada a Mercado Pago
- `✅ Libro entregado`  → post-pago

---

## Problemas comunes

| Síntoma | Causa probable |
|---|---|
| Bot no responde | Verificar `WHATSAPP_API_TOKEN` y que la WABA esté suscrita al app |
| IA devuelve texto raro tipo "According to rules..." | Reasoning leak — verificar que `geminiService` use `msg.content`, no `msg.reasoning` |
| MP devuelve `invalid_notification_url` | Quitar `MP_NOTIFICATION_URL` de env (dejar sin webhook inline) o usar un dominio propio |
| Link MP no llega tras "sí" | El LLM no llamó la tool — revisar prompt / dar más contexto en el `history` |
| `book_id no existe` en logs | El LLM alucinó un id — search_books antes de send_payment_link resuelve esto |
