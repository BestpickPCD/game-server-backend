import { Roles } from '@prisma/client';
import { NextFunction, Response } from 'express';
import { message } from '../utilities/constants/index.ts';
import {
  permissions,
  RouteType,
  PermissionType,
  roles,
  RoleType
} from '../models/permission.ts';

export const permission =
  (router: RouteType, method: PermissionType): any =>
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      if (!(req as any).user) {
        return res.status(401).json({ message: message.UNAUTHORIZED });
      }
      const { role }: { role: Roles } = (req as any).user;

      const hasRoles = roles.indexOf(role.name as RoleType);
      if (hasRoles === -1 && roles[hasRoles]) {
        return res
          .status(404)
          .json({ message: message.NOT_FOUND, subMessage: 'Role not found' });
      }

      const hasPermission =
        permissions[roles[hasRoles]][router].includes(method);
      if (!hasPermission) {
        return res.status(403).json({ message: message.FORBIDDEN });
      }

      return next();
    } catch (error) {
      return res
        .status(500)
        .json({ message: message.INTERNAL_SERVER_ERROR, error });
    }
  };
