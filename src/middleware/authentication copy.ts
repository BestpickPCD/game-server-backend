

// import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';

// // Secret key for signing and verifying tokens
// const JWT_SECRET_KEY = 'your-secret-key';

// // Middleware to protect routes that require authentication
// export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
//   const token = req.header('Authorization')?.replace('Bearer ', '');

//   if (!token) {
//     return res.status(401).json({ message: 'Unauthorized' });
//   }

//   jwt.verify(token, JWT_SECRET_KEY, (err: any, user: any) => {
//     if (err) {
//       return res.status(403).json({ message: 'Forbidden' });
//     }

//     // Attach the user data to the request object for use in other parts of the application
//     req.user = user;

//     // Proceed to the next middleware/route
//     next();
//   });
// };

// // Function to generate JWT for a user
// export const generateJWT = (user: any) => {
//   const token = jwt.sign(user, JWT_SECRET_KEY, { expiresIn: '1h' });
//   return token;
// };
