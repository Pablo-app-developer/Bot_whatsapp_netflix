import Groq from 'groq-sdk';
import { logger } from '../utils/logger.js';

let _groq = null;
const groq = () => {
    if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    return _groq;
};

// ─── CATÁLOGO ─────────────────────────────────────────────────────────────────
const COURSE_NAMES = {
    'hacking-etico': 'Hacking Ético',
    'python': 'Python desde Cero',
    'django': 'Django desde Cero',
    'excel': 'Excel que Sí Usas',
    'canva': 'Canva Pro en 1 Hora',
    'copywriting': 'Copywriting para WhatsApp',
    'productividad': 'Productividad Real',
    'redes-sociales': 'Redes Sociales que Venden',
    'finanzas': 'Finanzas Personales desde Cero',
};

const CATALOGO = `
🔐 hacking-etico — Hacking Ético — Kali Linux, Metasploit, OSINT, WiFi hacking, SQLi, XSS, Bug Bounty, Malware y más. +30 módulos.
🐍 python — Python desde Cero — variables, funciones, POO, automatización y proyectos reales desde cero.
🌐 django — Django desde Cero — crea aplicaciones web con Python: modelos, vistas, autenticación, deploy.
📊 excel — Excel que Sí Usas — fórmulas avanzadas, tablas dinámicas, dashboards y automatización con macros.
🎨 canva — Canva Pro en 1 Hora — diseño profesional de posts, logos y presentaciones sin ser diseñador.
📝 copywriting — Copywriting para WhatsApp — técnicas de escritura persuasiva aplicadas a ventas digitales.
🧠 productividad — Productividad Real — sistemas y herramientas para rendir más sin quemarte.
📱 redes-sociales — Redes Sociales que Venden — estrategia de contenido para convertir seguidores en clientes.
💰 finanzas — Finanzas Personales desde Cero — ahorro, inversión y libertad financiera desde Colombia.
`.trim();
// ──────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres el asistente de ventas de "Formación Para Todos" (formacionparatodos.online), plataforma colombiana de cursos técnicos digitales. Tu nombre es Valeria.

TONO:
- Directo, confiado y sin rodeos. Como un buen vendedor, no como un asistente de soporte.
- WhatsApp: frases cortas, sin párrafos. Máximo 3 líneas por mensaje.
- Emojis solo cuando refuerzan el mensaje. Nunca 🤔 ni emojis de duda.
- Nada de "con gusto", "claro que sí", ni frases de call center.

FLUJO DE VENTA — síguelo siempre EN ESTE ORDEN:

TURNO 1 (mención de tema o interés): mensajes como "hacking", "estoy interesado en X", "cuéntame de Y", "info del curso Z", "quiero saber de W" → SOLO responde con el pitch (2 líneas + precio + "¿Te lo mandamos?"). NO llames ninguna tool. NO envíes link. Esto es solo interés, aún no ha confirmado la compra.

TURNO 2 (confirmación tras el pitch): SOLO cuando el cliente responda algo como "sí", "dale", "listo", "ok", "perfecto", "va", "mándalo", "lo quiero" DESPUÉS de que le hiciste el pitch → AHÍ SÍ llama send_payment_link con el slug correcto y responde SOLO: "Listo, aquí el link 👇".

Si el cliente dice "quiero el de hacking" en su PRIMER mensaje sobre el tema, eso NO es confirmación — es interés. Responde con pitch y pregunta "¿Te lo mandamos?". Solo tras un segundo mensaje afirmativo llamas la tool.

REGLAS:
- NUNCA pegues un link de pago en el texto — usa SIEMPRE la tool send_payment_link para eso.
- NUNCA muestres tu razonamiento interno, análisis de reglas ni comentarios tipo "According to rules...". Solo la respuesta directa al cliente.
- NUNCA preguntes "¿quieres saber más?" ni "¿quieres el contenido?". Si hay interés, mueve al cierre con el pitch.
- Nunca inventes precios ni temas fuera del catálogo.
- Si preguntan si eres un bot: "soy el asistente de Formación Para Todos."

EJEMPLO CORRECTO:
Cliente: "estoy interesado en el curso de hacking"
Tú: "El de Hacking Ético es el más completo — Kali Linux, Metasploit, WiFi hacking, Bug Bounty y +30 módulos. $10.000 COP, acceso de por vida. ¿Te lo mandamos?"
Cliente: "sí"
Tú: [llama tool send_payment_link con "hacking-etico"] "Listo, aquí el link 👇"

EJEMPLO INCORRECTO (NO hagas esto):
Cliente: "estoy interesado en el curso de hacking"
Tú: [llama tool] "Listo, aquí el link" ← MAL, aún no confirmó, primero el pitch.

CATÁLOGO (formato: slug — nombre — descripción, todos $10.000 COP, entrega inmediata por WhatsApp):
${CATALOGO}

ENTREGA:
- Al pagar reciben el material por este mismo WhatsApp de forma automática.
- Acceso de por vida.`;

const TOOLS = [{
    type: 'function',
    function: {
        name: 'send_payment_link',
        description: 'Envía un link de pago de Mercado Pago al cliente. Úsalo cuando el cliente confirme (explícita o implícitamente) que quiere comprar un curso que le acabas de ofrecer. Ejemplos de confirmación: "sí", "dale", "listo", "va", "ok", "perfecto", "me interesa", "lo quiero".',
        parameters: {
            type: 'object',
            properties: {
                course_slug: {
                    type: 'string',
                    enum: Object.keys(COURSE_NAMES),
                    description: 'Slug del curso que el cliente quiere comprar',
                },
            },
            required: ['course_slug'],
        },
    },
}];

export const getAIResponse = async (conversationHistory) => {
    try {
        const messages = conversationHistory.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
        }));

        const response = await groq().chat.completions.create({
            model: 'openai/gpt-oss-20b',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...messages,
            ],
            tools: TOOLS,
            tool_choice: 'auto',
            temperature: 0.6,
            max_tokens: 400,
        });

        const msg = response.choices[0]?.message;
        // NUNCA usar msg.reasoning como texto — es el chain-of-thought interno de gpt-oss.
        const text = msg?.content?.trim() || '';

        let action = null;
        const toolCall = msg?.tool_calls?.[0];
        if (toolCall?.function?.name === 'send_payment_link') {
            try {
                const args = typeof toolCall.function.arguments === 'string'
                    ? JSON.parse(toolCall.function.arguments)
                    : toolCall.function.arguments;
                const slug = args.course_slug;
                if (COURSE_NAMES[slug]) {
                    action = {
                        type: 'send_payment_link',
                        serviceId: slug,
                        serviceName: COURSE_NAMES[slug],
                    };
                    logger.info('🛒 Tool call: send_payment_link', { slug });
                } else {
                    logger.warn('⚠️ Tool devolvió slug desconocido:', slug);
                }
            } catch (e) {
                logger.error('❌ Error parseando args de tool:', e.message);
            }
        }

        logger.info('🤖 AI Response:', {
            length: text.length,
            preview: text.substring(0, 60),
            action: action?.type,
        });

        return {
            text: text || (action ? 'Listo, aquí el link 👇' : 'Tuve un problema técnico un momento. ¿Me repites tu pregunta?'),
            action,
        };

    } catch (error) {
        // Rescate para el bug conocido de gpt-oss-20b con Harmony format
        const failed = error?.error?.failed_generation || error?.body?.error?.failed_generation;
        if (failed && typeof failed === 'string') {
            const match = failed.match(/"arguments"\s*:\s*([\s\S]*?)\}?\s*$/);
            if (match && match[1]) {
                const rescued = match[1].trim().replace(/^["']|["']$/g, '').trim();
                if (rescued.length > 5) {
                    logger.info('🔧 Respuesta rescatada de failed_generation:', rescued.substring(0, 60));
                    return { text: rescued, action: null };
                }
            }
        }

        logger.error('❌ Error getting AI response:', {
            message: error?.message,
            status: error?.status,
            body: error?.response?.data || error?.error,
        });
        return {
            text: 'Uy parce, se me trabó el cel un segundo 😅 ¿Me repites qué necesitabas?',
            action: null,
        };
    }
};
