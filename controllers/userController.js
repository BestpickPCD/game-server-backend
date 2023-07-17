const userRoutes = require('../routes/users')

module.exports = (app) => {
    app.get('/users', userRoutes.getAllUsers )
    app.put('/user/:userId', userRoutes.updateUser )
    app.get('/users', userRoutes.getAllUsers )
    app.get('/users', userRoutes.getAllUsers )
    app.post('/register', userRoutes.register )
    app.post('/login', userRoutes.login )
}

