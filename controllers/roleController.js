const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const getRoles = async (req, res) => {
    try {
        const roles = await prisma.roles.findMany({
            where:{ deletedAt: null },
            orderBy: { name: 'asc' }
        })
        res.status(200).json(roles)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message:"something went wrong", error })
    }
}

const addRole = async (req, res) => { 
    try {
        const { name } = req.body 
        const roleCheck = await prisma.roles.findMany({
            where: { name }
        }) 

        if( roleCheck.length == 0 ) {
            const role = await prisma.roles.create({
                data: { name }
            }) 

            role && res.status(201).json({message:"role created"})
        }
        else
            res.status(500).json({message:"role exists"}) 

    } catch (error) {
        console.log(error)
        res.status(500).json({ message:"something went wrong", error })
    }
}

const updateRole = async (req, res) => {
    try {
        const roleId = parseInt(req.params.roleId)
        const { name } = req.body

        const updatedRole = await prisma.roles.update({
            where: { id: roleId },
            data: { name },
        });
        
        if (!updatedRole) 
            return res.status(404).json({ message: "Role not found" });
        else
            res.status(200).json({ message: "Role updated" }); 
 
    } catch (error) {
        console.log(error)
        res.status(500).json({ message:"something went wrong", error })
    }
}

const deleteRole = async (req, res) => {
    try { 
        const roleId = parseInt(req.params.roleId)
        const updatedRole = await prisma.roles.update({
            where: { id: roleId },
            data: { deletedAt: new Date() },
        });
        
        if (!updatedRole) 
            return res.status(404).json({ message: "Role not found" }) 
        else
            res.status(404).json({ message: "Role soft-deleted" }) 

    } catch (error) {
        console.log(error)
        res.status(500).json({ message:"something went wrong", error })
    }
}


module.exports = { getRoles, addRole, updateRole, deleteRole }