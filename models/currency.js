const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const findById = async (currencyId) => {
    const currency = await prisma.currencies.findFirst({
        where: {
            id: currencyId
        }
    })
    
    return currency
}

module.exports = { findById }