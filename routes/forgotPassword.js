const express = require('express');
const crypto = require('crypto');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

dotenv.config();

const router = express.Router();
const pool = require('../db');

async function sendEmailDynamic({ to, subject, text }) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_USER_GMAIL,
            pass: process.env.MAIL_PASS_GMAIL
        }
    });

    const mailOptions = {
        from: process.env.MAIL_USER_GMAIL,
        to,
        subject,
        text
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                return reject(err);
            }
            resolve(info);
        });
    });
}

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        // Проверка, существует ли пользователь
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const code = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await pool.query(
            `INSERT INTO password_reset_codes (email, code, expires_at)
             VALUES ($1, $2, $3)
             ON CONFLICT (email) DO UPDATE SET code = $2, expires_at = $3`,
            [email, code, expiresAt]
        );

        await sendEmailDynamic({
            to: email,
            subject: 'Код восстановления пароля',
            text: `Ваш код: ${code}`
        });

        res.json({ message: 'Код отправлен на почту' });

    } catch (err) {
        console.error('Ошибка при отправке кода:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});


router.post('/reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM password_reset_codes WHERE email = $1',
            [email]
        );

        const resetData = result.rows[0];
        if (!resetData || resetData.code !== code || new Date(resetData.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Неверный или истёкший код' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);

        // Удаляем код после использования
        await pool.query('DELETE FROM password_reset_codes WHERE email = $1', [email]);

        res.json({ message: 'Пароль успешно обновлён' });
    } catch (err) {
        console.error('Ошибка при сбросе пароля:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;

/**
 * @swagger
 * tags:
 *   - name: Auth-ForgotPassword
 *     description: Забыли пароль
 */

/**
 * @swagger
 * /api/forgot-password:
 *   post:
 *     summary: Забыли пароль
 *     tags: [Auth-ForgotPassword]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Почта
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Код отправлен на почту
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Ошибка сервера
 */

/**
 * @swagger
 * /api/reset-password:
 *   post:
 *     summary: Сброс пароля
 *     tags: [Auth-ForgotPassword]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Почта
 *               code:
 *                 type: string
 *                 description: Код
 *               newPassword:
 *                 type: string
 *                 description: Новый пароль
 *             required:
 *               - email
 *               - code
 *               - newPassword
 *     responses:
 *       200:
 *         description: Пароль успешно обновлён
 *       400:
 *         description: Неверный или истёкший код
 *       500:
 *         description: Ошибка сервера
 */