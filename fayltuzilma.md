# Fayl Tuzilmasi

## Loyihaning maqsadi

`sat-turbo-bot` — Telegraf (Telegram bot) bilan yozilgan o‘quv marafoni dasturi.  
Foydalanuvchi referal havolalar orqali ball to‘plashi, VIP kanallarga kirish huquqi olish va kitoblar to‘plamini ko‘rib, zarur ballar yetganda yuklab olishi mumkin.  
Bot SQLite bazasida foydalanuvchilar, referral (taklif) yozuvlari hamda kitoblar haqidagi ma’lumotlarni saqlaydi.

## Asosiy fayl/folderlar

```
.
├── .env                 # Maxfiy sozlamalar (telegram token, kanal/guruh ID)
├── package.json         # NPM scriptlar va kutubxonalar ro‘yxati
├── database.sqlite     # (ma’lumotlar bazasi fayli — diqqat, deployda saqlovchi bo‘lishi mumkin)
├── src/
│   ├── bot.js           # Botni ishga tushirish, monitoring interval’lari
│   ├── config.js        # Muhit o‘zgaruvchilari (token, kanal nom/ID)
│   ├── db.js            # SQLite jadvalini yaratish va boshlang‘ich kitob yozuvi
│   ├── handlers/
│   │   ├── start.js     # /start komandasi, referal qo‘shish, kanal tekshiruvi, menyu
│   │   ├── ref.js       # Taklif havolasi va tugma
│   │   ├── points.js    # Ballar bilan ishlovchi handler
│   │   ├── link.js      # VIP link va qoidalar tugmalari
│   │   └── books.js     # Kitoblar menyusi, inline tugmalar va yuklab berish
│   ├── keyboards/
│   │   └── mainKeyboard.js  # Asosiy menyu tugmalari (xususan Kitoblar)
│   └── services/
│       ├── userService.js      # Foydalanuvchi, referral, points bilan ishlash
│       ├── accessService.js    # Majburiy kanal a’zoligini tekshirish
│       ├── vipService.js       # VIP dan chiqarish monitoringi
│       ├── referralMonitorService.js  # Referral monitoringi va ballar kamaytirish
│       └── bookService.js      # Kitoblar ro‘yxatini olish va fayl identifikatsiyasi
├── handlers/              # (agar mavjud bo‘lsa) boshqa yuqori darajali handlerlar
├── assets/
│   └── books/
│       └── sat-math-guide.txt  # Namunaviy kitob
└── BOOKS.md              # Kitoblar tizimi bo‘yicha hujjat
```

## Qo‘shimcha ma’lumot

- `fayltuzilma.md` bilan birga yakuniy hujjatda barcha fayllar qanday maqsadda ekanligi va bir-biri bilan bog‘liqligini qisqacha yozish foydalidir.  
- `assets/books` papkasiga yangi kitoblar (PDF/TXT) joylanadi, keyin `books` jadvaliga yozuv qo‘shilib, bot menyuda ko‘rinadi.  
- `database.sqlite` darhol foydalanuvchi ma’lumotlari, referal faoliyati va yuklab olinadigan kitoblar bo‘yicha to‘g‘ridan-to‘g‘ri yozuvlar saqlaydi; render yoki boshqa hostingga joylaganda cheklovlar bor (permanent disk yoki tashqi DB tavsiya qilinadi).  
- `src/handlers/books.js` foydalanuvchi ballariga qarab inline tugmalar va `replyWithDocument` orqali fayl yetkazib beradi.

## Foydalanish

Botni ishga tushirishdan oldin `.env` faylini to‘ldiring: `BOT_TOKEN`, `REQUIRED_CHANNEL_USERNAME`, `CLOSED_CHANNEL_ID`, `CLOSED_GROUP_ID`.  
So‘ng `npm install` qilib, `npm start` (yoki `node src/bot.js`) bilan ishga tushiring. Agar xatoliklar bo‘lsa, loglar `bot.js` ichidagi interval chaqiriqlari tomonidan yoziladi.  

