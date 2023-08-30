import { NextFunction, Response } from 'express';
import { PermissionType, RouteType } from '../models/permission.ts';
import { getById } from '../services/roleService.ts';
import { message } from '../utilities/constants/index.ts';

export const permission =
  (router: RouteType, method: PermissionType): any =>
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      if (!(req as any).user) {
        return res.status(401).json({ message: message.UNAUTHORIZED });
      }
      const { roleId } = (req as any).user;
      const roleById = await getById({ id: Number(roleId) });
      if (roleById && router) {
        const permissions = (roleById as any)?.permissions[router];
        if (permissions.includes(method)) {
          return next();
        }
        return res.status(403).json({ message: message.FORBIDDEN });
      }

      return next();
    } catch (error) {
      return res
        .status(500)
        .json({ message: message.INTERNAL_SERVER_ERROR, error });
    }
  };
