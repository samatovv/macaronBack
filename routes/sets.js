const express = require('express');
const pool = require('../db');

const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authenticateToken = require('../middleware/authenticateToken');

// Создаем папку для загрузок, если не существует
const uploadDir = path.join(__dirname, '../uploads/promotions');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

router.get('/', async (req, res) => {
    try {
        const { popular, ready, wedding } = req.query;
        let query = 'SELECT * FROM sets';
        const conditions = [];
        const values = [];

        if (popular !== undefined) {
            values.push(popular === 'true');
            conditions.push(`popular = $${values.length}`);
        }

        if (ready !== undefined) {
            values.push(ready === 'true');
            conditions.push(`ready = $${values.length}`);
        }

        if (wedding !== undefined) {
            values.push(wedding === 'true');
            conditions.push(`wedding = $${values.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        const result = await pool.query(query, values);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching sets:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM sets WHERE id = $1', [id]);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching sets by ID:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', upload.array('images', 5), authenticateToken, async (req, res) => {
    const { name, short_description, description, price, discount_price, popular, ready, wedding } = req.body;
    const imagePaths = req.files.map(file => `/uploads/sets/${file.filename}`);

    try {
        const result = await pool.query(
            'INSERT INTO sets (name, short_description, description, price, discount_price, popular, ready, wedding, images) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [name, short_description, description, price, discount_price, popular, ready, wedding, imagePaths]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating sets:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, short_description, description, price, discount_price, popular, ready, wedding } = req.body;
    const imagePaths = req.files.map(file => `/uploads/sets/${file.filename}`);

    try {
        const result = await pool.query(
            'UPDATE sets SET name = $1, short_description = $2, description = $3, price = $4, discount_price = $5, popular = $6, ready = $7, wedding = $8, images = $9 WHERE id = $10 RETURNING *',
            [name, short_description, description, price, discount_price, popular, ready, wedding, imagePaths, id]
        );
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error updating sets:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM sets WHERE id = $1 RETURNING *', [id]);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error deleting sets:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Sets
 *   description: Наборы
 */

/**
 * @swagger
 * /api/sets:
 *   post:
 *     summary: Создать набор
 *     security:
 *       - BearerAuth: []
 *     tags: [Sets]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - short_description
 *               - description
 *               - price
 *               - discount_price
 *               - popular
 *               - ready
 *               - wedding
 *               - images
 *             properties:
 *               name:
 *                 type: string
 *               short_description:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               discount_price:
 *                 type: number
 *               popular:
 *                 type: boolean
 *               ready:
 *                 type: boolean
 *               wedding:
 *                 type: boolean
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Акция создана
 *       500:
 *         description: Ошибка сервера
 */

/**
 * @swagger
 * /api/sets:
 *   get:
 *     summary: Получить список наборов с возможной фильтрацией
 *     tags: [Sets]
 *     parameters:
 *       - in: query
 *         name: popular
 *         schema:
 *           type: boolean
 *         description: Фильтр по популярным наборам
 *       - in: query
 *         name: ready
 *         schema:
 *           type: boolean
 *         description: Фильтр по готовым наборам
 *       - in: query
 *         name: wedding
 *         schema:
 *           type: boolean
 *         description: Фильтр по свадебным наборам
 *     responses:
 *       200:
 *         description: Список наборов
 *       500:
 *         description: Внутренняя ошибка сервера
 */

/**
 * @swagger
 * /api/sets/{id}:
 *   get:
 *     summary: Получить набор по ID
 *     tags: [Sets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID акции
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Набор
 *       500:
 *         description: Ошибка сервера
 */

/**
 * @swagger
 * /api/sets/{id}:
 *   put:
 *     summary: Обновить набор
 *     security:
 *       - BearerAuth: []
 *     tags: [Sets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID акции
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *          multipart/form-data:
 *           schema:
 *           type: object
 *           required:
 *               - name
 *               - short_description
 *               - description
 *               - price
 *               - discount_price
 *               - popular
 *               - ready
 *               - wedding
 *               - images
 *           properties:
 *               name:
 *                  type: string
 *               short_description:
 *                  type: string
 *               description:
 *                  type: string
 *               price:
 *                  type: number
 *               discount_price:
 *                  type: number
 *               popular:
 *                  type: boolean
 *               ready:
 *                  type: boolean
 *               wedding:   
 *                  type: boolean
 *               images:
 *                  type: string
 *               format: binary
 *     responses:
 *       200:
 *         description: Набор обновлена
 *       500:
 *         description: Ошибка сервера
 */

/**
 * @swagger
 * /api/sets/{id}:
 *   delete:
 *     summary: Удалить набор
 *     security:
 *       - BearerAuth: []
 *     tags: [Sets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID акции
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Набор удалена
 *       500:
 *         description: Ошибка сервера
 */