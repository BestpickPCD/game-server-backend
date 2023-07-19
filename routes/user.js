const userController = require('../controllers/userController')

module.exports = (app) => {
    app.get('/users', userController.getAllUsers )
    app.put('/user/:userId', userController.updateUser ) 
    app.delete('/user/:userId', userController.deleteUser )
    app.post('/register', userController.register )
    app.post('/login', userController.login )
}

