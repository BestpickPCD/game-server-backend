require('dotenv').config()
const express = require('express')
const app = express()
const mysql = require('mysql')
app.use(express.json()); 

//controllers
const userController = require('./controllers/userController')

// use controllers
userController(app)


const port = process.env.PORT
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});  