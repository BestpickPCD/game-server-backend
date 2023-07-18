const roleRoutes = require('../routes/roles')

module.exports = (app) => {
    
    app.get('/roles', roleRoutes.getRoles)

}