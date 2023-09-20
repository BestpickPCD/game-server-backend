import { NextFunction, Response } from 'express';
import { PermissionType, RouteType } from '../models/permission.ts';
import { getById } from '../services/roleService.ts';
import { FORBIDDEN, UNAUTHORIZED } from '../core/error.response.ts';

const message = {
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden'
};

export const permission =
  (router: RouteType, method: PermissionType): any =>
  async (req: Request, _: Response, next: NextFunction): Promise<any> => {
    try {
      if (!(req as any).user) {
        throw new UNAUTHORIZED(message.UNAUTHORIZED);
      }
      const roleId = Number((req as any)?.user?.roleId);
      const roleById = await getById(roleId);

      if (roleById && router) {
        const permissions = (roleById as any)?.permissions[router];
        if (permissions.includes(method)) {
          return next();
        }
        throw new FORBIDDEN(message.FORBIDDEN);
      }
      return next();
    } catch (error: any) {
      return next(new FORBIDDEN(message.FORBIDDEN));
    }
  };
