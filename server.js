require('dotenv').config()
const express = require('express')
const app = express() 
app.use(express.json()); 

//controllers
const userController = require('./controllers/userController')
const roleController = require('./controllers/roleController')
const currencyController = require('./controllers/currencyController')
// use controllers
userController(app)
roleController(app)
currencyController(app)

const port = process.env.PORT
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
})