const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ message: 'Token required' });
    }

    console.log("Received token: ", token); // Логируем токен

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error('JWT Error:', err); // Распечатайте ошибку для дальнейшего анализа
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = decoded;
        next();
    });
    
};


module.exports = authenticateToken;
