require('dotenv').config()
const express = require('express')
const app = express() 
app.use(express.json()); 

//controllers
const userRoutes = require('./routes/user')
const roleRoutes = require('./routes/role')
const currencyRoutes = require('./routes/currency')
// use controllers
userRoutes(app)
roleRoutes(app)
currencyRoutes(app)

const port = process.env.PORT
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
})
   