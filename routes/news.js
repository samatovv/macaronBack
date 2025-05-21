const express = require('express');
const pool = require('../db');

const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authenticateToken = require('../middleware/authenticateToken');

// Создаем папку для загрузок, если не существует
const uploadDir = path.join(__dirname, '../uploads/news');
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
        const result = await pool.query('SELECT * FROM news');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching news by ID:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', upload.array('images', 5), authenticateToken, async (req, res) => {
    const { name, short_description, description, price, discount_price } = req.body;
    const imagePaths = req.files.map(file => `/uploads/news/${file.filename}`);

    try {
        const result = await pool.query(
            'INSERT INTO news (name, short_description, description, price, discount_price, images) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, short_description, description, price, discount_price, imagePaths]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating news:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, short_description, description, price, discount_price } = req.body;
    const imagePaths = req.files.map(file => `/uploads/news/${file.filename}`);

    try {
        const result = await pool.query(
            'UPDATE news SET name = $1, short_description = $2, description = $3, price = $4, discount_price = $5, images = $6 WHERE id = $7 RETURNING *',
            [name, short_description, description, price, discount_price, imagePaths, id]
        );
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error updating news:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM news WHERE id = $1 RETURNING *', [id]);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error deleting news:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: News
 *   description: Новости
 */

/**
 * @swagger
 * /api/news:
 *   post:
 *     summary: Создать новости
 *     security:
 *       - BearerAuth: []
 *     tags: [News]
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
 *                 format: float
 *                 exemple: 100.00
 *               discount_price:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Новости создана
 *       500:
 *         description: Ошибка сервера
 */

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Новости
 *     tags: [News]
 *     responses:
 *       200:
 *         description: Новости
 *       500:
 *         description: Ошибка сервера
 */

/**
 * @swagger
 * /api/news/{id}:
 *   get:
 *     summary: Новости
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID акции
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Новости
 *       500:
 *         description: Ошибка сервера
 */

/**
 * @swagger
 * /api/news/{id}:
 *   put:
 *     summary: Обновить новости
 *     security:
 *       - BearerAuth: []
 *     tags: [News]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - short_description
 *               - description
 *               - price
 *               - discount_price
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
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Новости обновлена
 *       500:
 *         description: Ошибка сервера
 */


/**
 * @swagger
 * /api/news/{id}:
 *   delete:
 *     summary: Удалить новости
 *     security:
 *       - BearerAuth: []
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID акции
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Новости удалена
 *       500:
 *         description: Ошибка сервера
 */