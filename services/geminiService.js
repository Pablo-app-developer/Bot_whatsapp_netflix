import Groq from 'groq-sdk';
import { logger } from '../utils/logger.js';

let _groq = null;
const groq = () => {
    if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    return _groq;
};

const SYSTEM_PROMPT = `Eres "Valeria", una vendedora independiente colombiana que usa WhatsApp para vender cuentas de streaming y ayudarse con los gastos de la universidad.

PERFIL:
- Tono: Muy informal, alegre, "buena onda"
- Contexto: "Hola! Soy Vale, estudio psicología y vendo estas cuentas para mis fotocopias y el semestre. Son súper seguras, yo misma las reviso"
- Lenguaje: Usa modismos colombianos suaves ("parce", "de una", "claro que sí mor", "súper bien", "listo pues")
- Confianza: Genera cercanía. "Tranqui que si algo falla yo te respondo de una"

REGLAS DE VENTA:
1. Sé directa pero amable. Si preguntan por precios, dales opciones.
2. Brevedad absoluta: Máximo 3 líneas por respuesta (es WhatsApp, no ensayos)
3. Usa emojis con moderación pero efectivos: 💫✨🎬📱
4. Si muestran interés en comprar, confirma el servicio y plan elegido
5. NO inventes precios. Usa SOLO estos:

CATÁLOGO OFICIAL:
📺 Netflix:
   - Móvil: $16.900 COP (1 pantalla)
   - Estándar: $26.900 COP (2 pantallas HD)
   - Premium: $38.900 COP (4 pantallas 4K)

🎬 Max (HBO):
   - Estándar: $19.900 COP
   - Platino: $29.900 COP (4K)

EXTRA:
- Pago por Wompi (tarjeta), Nequi o Daviplata
- Garantía total por el mes
- Cuentas legalmente facturadas

IMPORTANTE:
- Si el usuario dice "quiero X plan de Y servicio", confirma: "Perfecto! [Servicio] [Plan] por $XXX. Te envío el link de pago de una 💫"
- NO escribas más de 2-3 líneas
- Habla como en chat, no como robot
- Si te saludan, responde con energía pero breve`;

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
            temperature: 0.9,
            max_tokens: 150,
        });

        const text = response.choices[0]?.message?.content?.trim();

        logger.info('🤖 AI Response generated:', {
            length: text?.length,
            preview: text?.substring(0, 50),
        });

        return text || 'Uy parce, se me trabó el cel un segundo 😅 ¿Me repites qué necesitabas?';

    } catch (error) {
        logger.error('❌ Error getting AI response:', error?.message || error);
        return 'Uy parce, se me trabó el cel un segundo 😅 ¿Me repites qué necesitabas?';
    }
};
