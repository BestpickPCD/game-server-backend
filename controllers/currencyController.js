const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const getCurrencies = async (req, res) => {
    try {
        const currencies = await prisma.currencies.findMany()
        res.status(200).json(currencies)
    } catch (error) {
        res.status(500).json({message:error})
        console.log(error)
    }
}


module.exports = { getCurrencies }