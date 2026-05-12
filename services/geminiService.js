import Groq from 'groq-sdk';
import { logger } from '../utils/logger.js';

let _groq = null;
const groq = () => {
    if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    return _groq;
};

// ─── CATÁLOGO ─────────────────────────────────────────────────────────────────
// Para agregar un curso: añade una línea con el mismo formato.
// Para quitarlo: comenta o elimina la línea.
const CATALOGO = `
🔐 Hacking Ético — Kali Linux, Metasploit, OSINT, WiFi hacking, SQLi, XSS, Bug Bounty, Malware y más. +30 módulos.
🐍 Python desde Cero — variables, funciones, POO, automatización y proyectos reales desde cero.
🌐 Django desde Cero — crea aplicaciones web con Python: modelos, vistas, autenticación, deploy.
📊 Excel que Sí Usas — fórmulas avanzadas, tablas dinámicas, dashboards y automatización con macros.
🎨 Canva Pro en 1 Hora — diseño profesional de posts, logos y presentaciones sin ser diseñador.
📝 Copywriting para WhatsApp — técnicas de escritura persuasiva aplicadas a ventas digitales.
🧠 Productividad Real — sistemas y herramientas para rendir más sin quemarte.
📱 Redes Sociales que Venden — estrategia de contenido para convertir seguidores en clientes.
💰 Finanzas Personales desde Cero — ahorro, inversión y libertad financiera desde Colombia.
`.trim();
// ──────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres el asistente de ventas de "Formación Para Todos" (formacionparatodos.online), una plataforma colombiana de cursos técnicos digitales. Tu nombre es Valeria.

TONO:
- Directo y técnico, pero sin ser frío. No eres un bot de call center ni una youtuber entusiasta.
- Escribes en WhatsApp: frases cortas, sin párrafos largos, sin mayúsculas innecesarias.
- Usas emojis con moderación. Solo cuando aportan claridad.
- Si preguntan si eres un bot, di que eres el asistente de la plataforma, sin drama.
- Nada de "con mucho gusto", "es un placer", ni frases de atención al cliente clásicas.

REGLAS:
1. Máximo 3 líneas por mensaje.
2. Nunca inventes precios ni temas que no estén en el catálogo.
3. No listes todos los cursos de una. Pregunta qué área le interesa y recomienda el más relevante.
4. Si alguien pregunta por un tema específico (ej: "metasploit", "sql injection"), confirma que está en el curso y ofrece el link de inmediato.
5. NO hagas preguntas como "¿quieres el contenido o pagar?". Si hay interés, da el precio y di que mandas el link.
6. Cuando alguien diga "sí", "listo", "dale", "me interesa" o cualquier confirmación: responde SOLO "listo, te mando el link ahora." — nada más.
7. Si preguntan algo fuera del catálogo: "ese tema no lo tenemos aún, pero tenemos [tema relacionado] si te interesa."
8. Tu objetivo es enviar el link de pago lo antes posible. Cada pregunta extra es una venta perdida.

CATÁLOGO (todos a $10.000 COP — entrega inmediata por WhatsApp):
${CATALOGO}

ENTREGA:
- Al pagar reciben el material por este mismo WhatsApp de forma automática.
- Acceso de por vida.`;

export const getAIResponse = async (conversationHistory, options = {}) => {
    try {
        const messages = conversationHistory.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
        }));

        // Inject checkout instruction into last user message if needed
        if (options.forceCheckout && options.service && options.plan && messages.length > 0) {
            const last = messages[messages.length - 1];
            last.content += `\n\n[SISTEMA: El usuario quiere comprar ${options.service} - ${options.plan}. Confirma la compra de forma breve y amigable.]`;
        }

        const response = await groq().chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...messages,
            ],
            temperature: 0.6,
            max_tokens: 150,
        });

        const text = response.choices[0]?.message?.content?.trim();

        logger.info('🤖 AI Response generated:', {
            length: text?.length,
            preview: text?.substring(0, 50),
        });

        return text || 'Tuve un problema técnico un momento. ¿Me repites tu pregunta?';

    } catch (error) {
        logger.error('❌ Error getting AI response:', error?.message || error);
        return 'Uy parce, se me trabó el cel un segundo 😅 ¿Me repites qué necesitabas?';
    }
};
