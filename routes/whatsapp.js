import express from 'express';
import { verifyWebhook, handleIncomingMessage, handleWompiWebhook } from '../controllers/whatsappController.js';

const router = express.Router();

router.get('/', verifyWebhook);
router.post('/', handleIncomingMessage);
router.post('/wompi', handleWompiWebhook);

router.get('/test', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
