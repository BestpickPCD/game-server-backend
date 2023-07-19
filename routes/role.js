const roleController = require('../controllers/roleController')

module.exports = (app) => {
    
    app.get('/roles', roleController.getRoles)
    app.post('/role', roleController.addRole)
    app.put('/role/:roleId', roleController.updateRole)
    app.delete('/role/:roleId', roleController.deleteRole)

}