const { Pool } = require('pg')

const pool = new Pool({
    user: 'abdurahman',
    host: 'localhost',
    database: 'macaron',
    password: '',
    port: 5432,
})

module.exports = pool