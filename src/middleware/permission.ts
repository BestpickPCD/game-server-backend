import { Request, Response, NextFunction } from 'express';
import { Users, Roles } from '@prisma/client'

interface UserRole extends Users {
  role: Roles;
} 
interface RequestUserRole extends Request {
  user: UserRole 
}

export const permission = (role: string) => async (req: RequestUserRole, res: Response, next: NextFunction): Promise<any> => {
    try {
      if ( req.user.role.name === role && role !== null ) {
        return next();
      }
      return res.status(403).json({ message: 'Unauthorized' });
    } catch (error) {
      return res.status(500).json({ message: 'An error occurred' });
    }
  };
