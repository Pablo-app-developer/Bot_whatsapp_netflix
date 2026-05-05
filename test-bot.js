/**
 * SCRIPT DE PRUEBA - Test rápido del bot sin WhatsApp
 * Simula la recepción de mensajes para verificar la lógica
 */

import { getAIResponse } from './services/geminiService.js';
import { extractPurchaseIntent } from './services/intentService.js';
import { logger } from './utils/logger.js';

const testMessages = [
    'Hola',
    'Cuánto cuesta Netflix?',
    'Quiero el plan premium',
    'Cuánto es Max?',
    'Dame Netflix estándar'
];

async function testBot() {
    console.log('\n🧪 ====================================');
    console.log('   PRUEBA DEL BOT (SIN WHATSAPP)');
    console.log('   ====================================\n');

    const conversationHistory = [];

    for (const userMessage of testMessages) {
        console.log(`\n👤 Usuario: "${userMessage}"`);
        console.log('─'.repeat(50));

        // Agregar mensaje al historial
        conversationHistory.push({
            role: 'user',
            content: userMessage,
            timestamp: new Date().toISOString()
        });

        // Detectar intención
        const intent = extractPurchaseIntent(userMessage, conversationHistory);

        if (intent.hasPurchaseIntent) {
            logger.success('🛒 Intención de compra detectada!', {
                service: intent.service,
                plan: intent.plan,
                price: intent.price
            });
        }

        // Obtener respuesta de IA
        const response = await getAIResponse(conversationHistory);

        console.log(`\n🤖 Valeria: "${response}"\n`);

        // Agregar respuesta al historial
        conversationHistory.push({
            role: 'assistant',
            content: response,
            timestamp: new Date().toISOString()
        });

        // Pausa para simular conversación real
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✅ ====================================');
    console.log('   PRUEBA COMPLETADA');
    console.log('   ====================================\n');
}

// Ejecutar pruebas
testBot().catch(error => {
    logger.error('Error en prueba:', error);
    process.exit(1);
});
