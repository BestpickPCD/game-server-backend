const currencyController = require('../controllers/currencyController')

module.exports = (app) => {
    app.get('/currencies', currencyController.getCurrencies)
    app.post('/currency', currencyController.addCurrency)
    app.put('/currency/:currencyId', currencyController.updateCurrency)
    app.delete('/currency/:currencyId', currencyController.deleteCurrency)
}