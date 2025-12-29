import express from 'express';
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

// --- إعدادات المسارات ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 7860;

// لتمكين السيرفر من قراءة البيانات المرسلة من الواجهة
app.use(express.json());
// لتقديم ملفات الواجهة (index.html) من مجلد public
app.use(express.static('public'));

// --- متغيرات الحالة (Status) ---
let botStatus = {
    running: false,
    targetUrl: '',
    targetViews: 0,
    completed: 0,
    logs: []
};

// --- دالة تسجيل السجلات (Logs) ---
function addLog(message) {
    const time = new Date().toLocaleTimeString();
    const entry = `[${time}] ${message}`;
    botStatus.logs.unshift(entry); // إضافة السجل في البداية ليظهر أولاً
    if (botStatus.logs.length > 20) botStatus.logs.pop(); // الاحتفاظ بآخر 20 سجل فقط
    console.log(entry);
}

// --- دالة تشغيل البوت الأساسية ---
async function runViewerBot(url, totalToReach) {
    if (botStatus.running) return;
    
    botStatus.running = true;
    botStatus.targetUrl = url;
    botStatus.targetViews = totalToReach;
    botStatus.completed = 0;
    botStatus.logs = [];

    addLog(`🚀 Ignition started for: ${url}`);

    while (botStatus.completed < botStatus.targetViews) {
        let browser = null;
        try {
            // إعدادات المتصفح المناسبة لبيئة Render
            browser = await puppeteer.launch({
    headless: "new",
    executablePath: '/usr/bin/chromium', // المسار الافتراضي في نظام لينكس/دوكر
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
    ]
});


            const page = await browser.newPage();
            // User-Agent ليبدو كزائر حقيقي
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            // دورة (Batch) من 50 مشاهدة لتوفير الرامات على Render
            for (let i = 0; i < 50; i++) {
                if (botStatus.completed >= botStatus.targetViews) break;

                try {
                    // زيارة الرابط مع مهلة دقيقة للتحميل
                    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
                    
                    // انتظار عشوائي بسيط للمحاكاة (2 - 4 ثواني)
                    const waitTime = Math.floor(Math.random() * 2000) + 2000;
                    await new Promise(r => setTimeout(r, waitTime));

                    // إعادة تحميل الصفحة لزيادة العداد
                    await page.reload({ waitUntil: 'domcontentloaded' });

                    botStatus.completed++;
                    
                    if (botStatus.completed % 10 === 0) {
                        addLog(`📈 Progress: ${botStatus.completed} / ${botStatus.targetViews}`);
                    }

                } catch (err) {
                    addLog(`⚠️ Minor issue: ${err.message.substring(0, 30)}...`);
                }
            }
        } catch (criticalError) {
            addLog(`❌ Critical Browser Error: ${criticalError.message}`);
        } finally {
            if (browser) {
                await browser.close();
                addLog("♻️ Cleaning RAM & Restarting Session...");
            }
        }
    }

    addLog("🎉 Mission Complete! All views achieved.");
    botStatus.running = false;
}

// --- مسارات الـ API (Endpoints) ---

// تشغيل البوت
app.post('/start', (req, res) => {
    const { url, views } = req.body;
    
    if (botStatus.running) {
        return res.status(400).json({ msg: "⚠️ A session is already active!" });
    }

    if (!url || !views) {
        return res.status(400).json({ msg: "❌ Please provide a URL and view count." });
    }

    // تشغيل البوت في الخلفية (Fire and Forget)
    runViewerBot(url, parseInt(views));
    
    res.json({ msg: "🚀 Bot ignited successfully in the background!" });
});

// الحصول على الحالة الحالية
app.get('/status', (req, res) => {
    res.json(botStatus);
});

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`
    -------------------------------------------
    💖 Velvet Viewer Server is Active!
    🔗 URL: http://localhost:${PORT}
    -------------------------------------------
    `);
});
