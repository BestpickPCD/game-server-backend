const jwt = require('jsonwebtoken')

const refreshHours = "72" // 3 days
const accessHours = "2" // 2 hrs

const getTokens = (userId) => { 
    // gen access token
    const accessKey = process.env.ACCESS_TOKEN_KEY 
    const accessToken = jwt.sign(
        {
            userId
        },
        accessKey,
        {
            expiresIn: `${accessHours}h`
        }
    )
    
    // gen refresh token
    const refreshKey = process.env.REFRESH_TOKEN_KEY
    const refreshToken = jwt.sign(
        {
            userId
        },
        refreshKey,
        {
            expiresIn: `${refreshHours}h`
        }
    )
 
    return { accessToken, refreshToken } 

} 

module.exports = { getTokens }