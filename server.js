const express = require('express')
const app = express()
const mysql = require('mysql')

//controllers
const userController = require('./controllers/userController')

// use controllers
userController(app)

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'game-server',
});


app.listen(3000, () => {
    console.log('Server started on port 3000');
});
  
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Connected to the database!');
    }
});