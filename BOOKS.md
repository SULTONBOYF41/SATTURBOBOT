# Kitoblar tizimi

## Nima o'zgardi
   
- `Kitoblar` tugmasi asosiy menyuga qo'shildi (shuningdek `/kitoblar` va `/books` buyruqlari ishlaydi).
- Foydalanuvchi o'z ballari va talab qilingan ballar haqida to'liq ro'yxat ko'radi.
- Tanlangan kitob uchun talab qilingan ballar yetarli bo'lsa, bot `assets/books` ichidagi faylni yuboradi.

## Talablar

1. Foydalanuvchi `/start` orqali ro'yxatdan o'tishi va majburiy kanal/guruhga a'zo bo'lishi kerak (shu kanalda a'zo ekanligi `REQUIRED_CHANNEL_USERNAME` orqali tekshiriladi).
2. Har bir kitob uchun `required_points` qiymati belgilangan, shu balldan kam bo'lsa kitobni yuklab olish huquqi yo'q.

## Kitob ma'lumotlari

`books` jadvali quyidagi ustunlarni saqlaydi:

| ustun | ma'nosi |
| --- | --- |
| `title` | Kitob sarlavhasi (inline tugma yorlig'i sifatida ko'rinadi) |
| `description` | Kitob haqidagi qisqacha izoh, menyuda ko'rinadi |
| `file_path` | Loyihaga nisbatan fayl yo'li (`assets/books/...`) |
| `required_points` | Shu kitobga kirish uchun kerakli ball (default 0) |
| `is_active` | Faol kitob flagi (1 - ko'rinadi, 0 - yashirin) |

`db.js` ishga tushganda ushbu jadval yaratiladi va namunaviy yozuv (`assets/books/sat-math-guide.txt`) qo'shiladi.

## Yangi kitob qo'shish

1. `assets/books` papkasiga yangi PDF yoki TXT fayl qo'ying (masalan: `assets/books/your-book.pdf`).
2. `sqlite3` konsolida yoki skript orqali quyidagi yozuvni kiriting:
   ```sql
   INSERT INTO books (title, description, file_path, required_points, is_active, created_at, updated_at)
   VALUES ('Kitob nomi', 'Qisqacha izoh', 'assets/books/your-book.pdf', 3, 1, DATETIME('now'), DATETIME('now'));
   ```
3. Botni qayta ishga tushiring - yangi kitob menyuda paydo bo'ladi.

## Foydalanish

- `/kitoblar` yoki `Kitoblar` tugmasi yordamida menyuni chaqiring.
- Inline tugmalar orqali tanlangan kitobni yuklab olishga urinib ko'ring.
- Har bir muvaffaqiyatli tanlov Telegram `replyWithDocument` orqali fayl yuboradi va tavsifni caption sifatida ko'rsatadi.

## Tavsiyalar

1. Kitob fayllari katta bo'lishi mumkin, shuning uchun ularni `assets/books` papkasiga tartibli joylashtiring va nom berishda izchil bo'ling.
2. Har bir kitob uchun maqsadga muvofiq `required_points` qiymatini belgilang (asosiy kitoblar uchun 2, premium kontent uchun 3 yoki 5).
3. Zarur bo'lsa, `books` jadvalidagi `is_active` ustunini 0 qilib, vaqtincha ko'rinmas qilish imkoniyatidan foydalaning.
