const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const getRoles = async (req, res) => {
    try {
        const roles = await prisma.roles.findMany()
        res.status(200).json(roles)
    } catch (error) {
        console.log(error)
        res.status(500).json({message:error})
    }
}


module.exports = { getRoles }