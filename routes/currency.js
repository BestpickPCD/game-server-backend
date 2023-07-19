const currencyController = require('../controllers/currencyController')

module.exports = (app) => {
    app.get('/currencies', currencyController.getCurrencies)
}