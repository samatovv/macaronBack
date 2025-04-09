const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../db'); // Подключение к базе данных
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

// Пример с более подробным логированием
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *',
            [email, hashedPassword]
        );

        const user = result.rows[0];

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ token, user });
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});


// Вход
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const user = result.rows[0];
    
    // Сравнение пароля
    if (await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return res.status(200).json({ token });
    } else {
        return res.status(401).json({ error: 'Невалидные данные' });
    }
});


module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Регистрация и вход
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Пользователь создан
 *       500:
 *         description: Ошибка сервера
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешный вход, возвращает токен
 *       400:
 *         description: Неверный пароль
 *       404:
 *         description: Пользователь не найден
 */
