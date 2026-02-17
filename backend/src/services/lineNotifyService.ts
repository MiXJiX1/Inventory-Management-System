import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Construct the absolute path to the .env file
// Going up two levels from services (src/services) to backend root
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const LINE_NOTIFY_API = 'https://notify-api.line.me/api/notify';

export const sendLineNotification = async (message: string) => {
    const token = process.env.LINE_NOTIFY_TOKEN;

    if (!token) {
        console.warn('LINE_NOTIFY_TOKEN is not set in .env');
        return;
    }

    try {
        await axios.post(
            LINE_NOTIFY_API,
            new URLSearchParams({ message }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        console.log('Line Notification sent:', message);
    } catch (error: any) {
        console.error('Error sending Line Notification:', error.response?.data || error.message);
    }
};
