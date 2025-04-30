const express = require('express');
const app = express();
const path = require('path');
const PORT = 3000;

const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const authRoutes = require('./routes/auth');
const promotionRoutes = require('./routes/promotion');
const newsRoutes = require('./routes/news');
const setsRoutes = require('./routes/sets');
const profileRoutes = require('./routes/profile');
const forgotPasswordRoutes = require('./routes/forgotPassword');

app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Macaron API',
            version: '1.0.0',
            description: 'API для управления пользователями',
        },
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                BearerAuth: [],
            },
        ],
    },
    apis: ['./routes/*.js'], // Указываем путь к файлам с комментариями для Swagger
};


const swaggerDocs = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/api/auth', authRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/sets', setsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api', forgotPasswordRoutes);




app.get('/', (req, res) => {
    res.send('Сервер работает ✅');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сервер работает на http://localhost:${PORT}`);
});

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],  // Разрешение для нескольких источников
    credentials: true,
}));  