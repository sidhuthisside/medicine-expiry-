const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const moment = require('moment');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const client = new Client();

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (HTML, CSS, JS)

// Event listener for QR code generation (to authenticate WhatsApp Web)
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan the QR code above to log in.');
});

// Event listener when the WhatsApp Web client is ready
client.on('ready', () => {
    console.log('Client is ready!');
});

// API endpoint to handle medicine registration and notification
app.post('/api/medicine', async (req, res) => {
    try {
        const { name, whatsapp, medicine, expiry } = req.body;

        if (!name || !whatsapp || !medicine || !expiry) {
            return res.status(400).json({ error: 'Missing required fields: name, whatsapp, medicine, expiry' });
        }

        const expiryMoment = moment(expiry);
        const reminderDate = expiryMoment.subtract(15, 'days').format('YYYY-MM-DD');
        const currentDate = moment().format('YYYY-MM-DD');

        if (moment(reminderDate).isSameOrBefore(currentDate)) {
            await client.sendMessage(`${whatsapp}@c.us`, `Hi ${name}, your medicine "${medicine}" is expiring in 15 days. Please return or replace it.`);
            res.json({ message: 'Notification sent!' });
        } else {
            res.json({ message: 'The medicine is not due to expire in the next 15 days.' });
        }
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Initialize WhatsApp Web client
client.initialize();

// Set up the server to listen on a specified port
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
