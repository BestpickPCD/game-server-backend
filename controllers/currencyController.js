const currencyRoutes = require('../routes/currencies')

module.exports = (app) => {
    app.get('/currencies', currencyRoutes.getCurrencies)
}