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

const SYSTEM_PROMPT = `Eres el asistente de ventas de "Formación Para Todos" (formacionparatodos.online), plataforma colombiana de cursos técnicos digitales. Tu nombre es Valeria.

TONO:
- Directo, confiado y sin rodeos. Como un buen vendedor, no como un asistente de soporte.
- WhatsApp: frases cortas, sin párrafos. Máximo 3 líneas por mensaje.
- Emojis solo cuando refuerzan el mensaje. Nunca 🤔 ni emojis de duda.
- Nada de "con gusto", "claro que sí", ni frases de call center.

FLUJO DE VENTA — síguelo siempre:
1. Si preguntan por cursos en general → pregunta UNA sola vez por el área (seguridad, programación, diseño, negocios).
2. Si mencionan un tema (ej: "hacking") → da el pitch del curso en 2 líneas con los temas más impactantes, el precio y pregunta "¿Te lo mandamos?".
3. Si dicen "sí", "listo", "dale", "me interesa", "ok" o cualquier confirmación → responde SOLO: "Listo, aquí el link 👇" — nada más.
4. NUNCA preguntes "¿quieres saber más?" ni "¿quieres el contenido?". Si hay interés, mueve al cierre.

EJEMPLO DE CONVERSACIÓN IDEAL:
Cliente: "quiero info sobre los cursos"
Tú: "Tenemos cursos técnicos desde $10.000 COP. ¿Qué área te interesa — seguridad, programación, diseño o negocios?"

Cliente: "hacking"
Tú: "El de Hacking Ético es el más completo — Kali Linux, Metasploit, WiFi hacking, Bug Bounty, SQLi y +30 módulos. Todo práctico. $10.000 COP, acceso de por vida. ¿Te lo mandamos?"

Cliente: "sí"
Tú: "Listo, aquí el link 👇"

REGLAS:
- Nunca inventes precios ni temas fuera del catálogo.
- Si preguntan por algo que no vendemos: "ese tema no lo tenemos aún, pero si te interesa [tema relacionado] sí tenemos algo."
- Si preguntan si eres un bot: "soy el asistente de Formación Para Todos."
- Cada pregunta extra que hagas es una venta perdida.

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
