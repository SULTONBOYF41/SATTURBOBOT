// src/handlers/books.js
const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');

const { BUTTON_BOOKS } = require('../keyboards/mainKeyboard');
const { checkRequiredChannel } = require('../services/accessService');
const { getUserByTelegramId } = require('../services/userService');
const { getVisibleBooks, getBookById, createBook } = require('../services/bookService');
const { ADMIN_IDS } = require('../config');

const projectRoot = path.resolve(__dirname, '..', '..');

// Admin uchun “keyingi documentni kutish” holati
const pendingAddBook = new Map(); // adminId -> { required_points, title, description }

function isAdmin(telegramId) {
    return Array.isArray(ADMIN_IDS) && ADMIN_IDS.includes(Number(telegramId));
}

function registerBooksHandler(bot) {
    // ✅ ID ni ko‘rish (admin ids yozish oson bo‘lsin)
    bot.command('myid', async (ctx) => {
        return ctx.reply(`🪪 Sizning Telegram ID: ${ctx.from.id}`);
    });

    // ✅ Books menu
    bot.command('kitoblar', async (ctx) => showBooks(ctx));
    bot.command('books', async (ctx) => showBooks(ctx));
    bot.hears(BUTTON_BOOKS, async (ctx) => showBooks(ctx));

    // ✅ Admin: add book
    // Format:
    // /addbook 10 | SAT Math Guide | Qisqa izoh...
    bot.command('addbook', async (ctx) => {
        if (!isAdmin(ctx.from.id)) {
            return ctx.reply('⛔ Bu buyruq faqat adminlar uchun.');
        }

        const text = ctx.message.text || '';
        const raw = text.replace(/^\/addbook(\s+)?/i, '').trim();

        if (!raw) {
            return ctx.reply(
                "✅ Format:\n/addbook 10 | Kitob nomi | Qisqa izoh\n\nKeyin kitob faylini (PDF/TXT) yuborasiz.\nBekor qilish: /cancel"
            );
        }

        const parts = raw.split('|').map((p) => p.trim()).filter(Boolean);

        const required_points = Number(parts[0]);
        const title = parts[1];
        const description = parts[2] || '';

        if (!Number.isFinite(required_points) || required_points < 0) {
            return ctx.reply("❌ required_points noto‘g‘ri. Masalan: /addbook 10 | SAT | Izoh");
        }
        if (!title) {
            return ctx.reply("❌ Kitob nomi yo‘q. Masalan: /addbook 10 | SAT Math Guide | Izoh");
        }

        pendingAddBook.set(ctx.from.id, { required_points, title, description });

        return ctx.reply(
            `✅ Tayyor.\n\n📌 Nomi: ${title}\n🎯 Ball: ${required_points}\n📝 Izoh: ${description || '(yo‘q)'}\n\nEndi kitob faylini (PDF/TXT) DOCUMENT sifatida yuboring.\nBekor qilish: /cancel`
        );
    });

    bot.command('cancel', async (ctx) => {
        if (pendingAddBook.has(ctx.from.id)) {
            pendingAddBook.delete(ctx.from.id);
            return ctx.reply('✅ Bekor qilindi.');
        }
        return ctx.reply('ℹ️ Hozir bekor qilinadigan jarayon yo‘q.');
    });

    // ✅ Admin fayl yuborsa – DB ga saqlaymiz (file_id)
    bot.on('document', async (ctx) => {
        if (!isAdmin(ctx.from.id)) return; // oddiy userlar document yuborsa aralashmaymiz
        const pending = pendingAddBook.get(ctx.from.id);
        if (!pending) return;

        try {
            const doc = ctx.message.document;
            const { required_points, title, description } = pending;

            await createBook({
                title,
                description,
                required_points,
                file_id: doc.file_id,
                file_name: doc.file_name,
                mime_type: doc.mime_type,
                file_size: doc.file_size,
            });

            pendingAddBook.delete(ctx.from.id);

            return ctx.reply(
                `✅ Kitob qo‘shildi!\n\n📌 ${title}\n🎯 Ball: ${required_points}\n📎 File: ${doc.file_name}\n\nEndi userlar "Kitoblar" menyusidan ko‘rishadi.`
            );
        } catch (e) {
            console.error('addbook document handler error:', e);
            return ctx.reply('❌ Kitobni saqlashda xatolik. Logni tekshiring.');
        }
    });

    // ✅ Book tanlash
    bot.action(/^book_(\d+)$/, async (ctx) => {
        await ctx.answerCbQuery();

        try {
            const bookId = Number(ctx.match[1]);
            if (Number.isNaN(bookId)) {
                return ctx.reply("Ushbu kitobni topib bo'lmadi.");
            }

            const user = await getUserByTelegramId(ctx.from.id);
            if (!user) return ctx.reply('Avval /start ni bosing.');

            const book = await getBookById(bookId);
            if (!book || !book.is_active) return ctx.reply('Bu kitob hozir mavjud emas.');

            if (user.points < book.required_points) {
                return ctx.reply(
                    `Bu kitobni yuklab olish uchun kamida ${book.required_points} ball kerak.\n` +
                    `Hozirda sizda ${user.points} ball bor.`
                );
            }

            const caption =
                `${book.title}\n\n` + (book.description || 'Hech qanday izoh berilmagan.');

            // ✅ 1) Avval Telegram file_id bo‘lsa shu bilan yuboramiz
            if (book.file_id) {
                return ctx.replyWithDocument(book.file_id, { caption });
            }

            // ✅ 2) Aks holda assets file_path orqali yuboramiz
            const bookFilePath = path.join(projectRoot, book.file_path);

            if (!fs.existsSync(bookFilePath)) {
                console.error('Book file missing:', bookFilePath);
                return ctx.reply("Kitob fayli serverda topilmadi. Ma'mur bilan bog'laning.");
            }

            return ctx.replyWithDocument(
                { source: bookFilePath, filename: path.basename(book.file_path) },
                { caption }
            );
        } catch (e) {
            console.error('book action error:', e);
            return ctx.reply('❌ Xatolik yuz berdi.');
        }
    });
}

async function showBooks(ctx) {
    const channelOk = await checkRequiredChannel(ctx);
    if (!channelOk) {
        return ctx.reply(
            "Kitoblarni ko'rishdan oldin majburiy kanal/guruhga a'zo bo'ling va /start ni qayta yuboring."
        );
    }

    const user = await getUserByTelegramId(ctx.from.id);
    if (!user) return ctx.reply('Avval /start ni bosing.');

    const books = await getVisibleBooks();
    if (!books.length) {
        return ctx.reply("Hozircha hech qanday kitob qo'shilmagan. Keyinroq qaytib keling.");
    }

    const inlineKeyboard = Markup.inlineKeyboard(
        books.map((book) => [
            Markup.button.callback(`${book.title} (${book.required_points} ball)`, `book_${book.id}`),
        ])
    );

    return ctx.reply(
        `📚 Kitoblar ro‘yxati:\n\n` +
        `Kerakli ball yig‘ib, tugmani bossangiz kitob yuboriladi.\n\n` +
        `Sizning ballaringiz: ${user.points}`,
        inlineKeyboard
    );
}

module.exports = {
    registerBooksHandler,
};
