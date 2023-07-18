const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const findById = async (roleId) => {
    const role = await prisma.roles.findUnique({
        where: {
            id: roleId
        }
    })

    return role
}

module.exports = { findById }