const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const authenticateToken = require('../middleware/authenticateToken');

// 🔒 Получить профиль текущего пользователя
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, first_name, last_name FROM users WHERE id = $1', [req.user.userId]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// 🔒 Обновить профиль текущего пользователя
router.put('/', authenticateToken, async (req, res) => {
    const { email, password, oldPassword, first_name, last_name } = req.body;

    try {
        let hashedPassword = null;

        if (password) {
            // Получаем текущий хэш пароля пользователя
            const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.userId]);
            const currentHashedPassword = userResult.rows[0]?.password;

            if (!currentHashedPassword) {
                return res.status(404).json({ error: 'Пользователь не найден' });
            }

            // Проверка старого пароля
            const isMatch = await bcrypt.compare(oldPassword, currentHashedPassword);
            if (!isMatch) {
                return res.status(400).json({ error: 'Неверный старый пароль' });
            }

            // Хэшируем новый пароль
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const result = await pool.query(
            `UPDATE users 
             SET email = COALESCE($1, email), 
                 password = COALESCE($2, password), 
                 first_name = COALESCE($3, first_name), 
                 last_name = COALESCE($4, last_name)
             WHERE id = $5 
             RETURNING id, email, first_name, last_name`,
            [email || null, hashedPassword || null, first_name || null, last_name || null, req.user.userId]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});


// 🔒 Удалить свой аккаунт (например, пользователь удаляет себя)
router.delete('/', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [req.user.userId]);
        res.json({ message: 'Профиль удалён' });
    } catch (err) {
        console.error('Error deleting profile:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;


/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Профиль
 */

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Получить список профилей
 *     tags: [Profile]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Список профилей
 *       500:
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /api/profile/{id}:
 *   get:
 *     summary: Получить профиль по ID
 *     security:
 *       - BearerAuth: []
 *     tags: [Profile]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID акции
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Профиль
 *       500:
 *         description: Ошибка сервера
 */

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Обновить профиль текущего пользователя
 *     security:
 *       - BearerAuth: []
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 description: Новый пароль
 *               oldPassword:
 *                 type: string
 *                 description: Текущий пароль (обязателен, если меняется пароль)
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Профиль обновлён
 *       400:
 *         description: Неверный старый пароль
 *       500:
 *         description: Ошибка сервера
 */

/**
 * @swagger
 * /api/profile/{id}:
 *   delete:
 *     summary: Удалить профиль
 *     security:
 *       - BearerAuth: []
 *     tags: [Profile]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID акции
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Профиль удалена
 *       500:
 *         description: Ошибка сервера
 */