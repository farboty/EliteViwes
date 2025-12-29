# استخدام نسخة Node مستقرة وخفيفة
FROM node:20-slim

# تثبيت متصفح Chromium والمكتبات التي يحتاجها (الحل النهائي لمشاكل Replit)
RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxss1 \
    libgtk-3-0 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# تحديد مكان العمل داخل السيرفر
WORKDIR /app

# نسخ ملفات المشروع
COPY package*.json ./
RUN npm install
COPY . .

# Hugging Face يستخدم بورت 7860 افتراضياً
ENV PORT=7860
EXPOSE 7860

# تشغيل البوت
CMD ["node", "index.js"]
