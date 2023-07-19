const roleController = require('../controllers/roleController')

module.exports = (app) => {
    
    app.get('/roles', roleController.getRoles)

}