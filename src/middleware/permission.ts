import { Request, Response, NextFunction } from 'express';

interface CustomRequest extends Request {
  user?: {
    role: {
      name: string;
    };
  };
}

export const permission =
  (role: string) =>
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role.name === role && role !== null) {
        return next();
      }
      return res.status(403).json({ message: 'Unauthorized' });
    } catch (error) {
      return res.status(500).json({ message: 'An error occurred' });
    }
  };
