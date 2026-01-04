// src/services/bookService.js
const db = require('../db');

function getVisibleBooks() {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT * FROM books WHERE is_active = 1 ORDER BY required_points ASC, title ASC',
            [],
            (err, rows) => {
                if (err) {
                    console.error('getVisibleBooks ERROR:', err);
                    return reject(err);
                }
                resolve(rows || []);
            }
        );
    });
}

function getBookById(bookId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM books WHERE id = ?', [bookId], (err, row) => {
            if (err) {
                console.error('getBookById ERROR:', err);
                return reject(err);
            }
            resolve(row || null);
        });
    });
}

function createBook({
    title,
    description,
    required_points,
    file_id,
    file_name,
    mime_type,
    file_size,
}) {
    const now = new Date().toISOString();

    // books.file_path NOT NULL bo‘lgani uchun placeholder qo‘yamiz
    const file_path = file_id ? `tg:${file_id}` : 'assets/books/unknown';

    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO books
        (title, description, file_path, required_points, is_active, created_at, updated_at, file_id, file_name, mime_type, file_size)
       VALUES
        (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`,
            [
                title,
                description || null,
                file_path,
                Number(required_points) || 0,
                now,
                now,
                file_id || null,
                file_name || null,
                mime_type || null,
                Number.isFinite(file_size) ? file_size : null,
            ],
            function (err) {
                if (err) {
                    console.error('createBook ERROR:', err);
                    return reject(err);
                }
                resolve({ id: this.lastID });
            }
        );
    });
}

module.exports = {
    getVisibleBooks,
    getBookById,
    createBook,
};
