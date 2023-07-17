const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient();

// Define your route handler to get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.users.findMany();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({ error: 'An error occurred while retrieving users.' });
  }
}

const register = async (req, res) => {

  try { 
    const { name, username, email, role_id, password, confirmPassword } = req.body;

    // Check if the user already exists
    const existingUser = await prisma.users.findUnique({
      where: {
        email: email,
        username: username,
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if password and confirm password match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Password and confirm password do not match' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const newUser = await prisma.users.create({
      data: {
        name: name,
        username: username,
        email: email,
        role_id: role_id,
        password: hashedPassword,
      },
    });

    const userResponse = {
      user_id: newUser.id,
      username: newUser.username 
    }

    // const { name, email, password, role_id, ...rest } = newUser

    res.status(201).json({ message: 'User registered successfully', data: userResponse });
    
  } catch (error) {
    console.log(error)
    res.status(500).json({message:error})
  }
}

module.exports = { getAllUsers, register };
