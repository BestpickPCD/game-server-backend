const userRoutes = require('../routes/users')

module.exports = (app) => {
    app.get('/users', userRoutes.getAllUsers )
}