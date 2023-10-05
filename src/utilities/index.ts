import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { Users } from '../config/prisma/generated/base-default/index.js';
import { message as constantMessages } from './constants/index.ts';

const refreshDays = '7'; // 3 days
const accessHours = '2'; // 2 hrs

const getTokens = (
  user: Users
): {
  accessToken: string;
  refreshToken: string;
} => {
  // gen access token
  const accessKey = process.env.ACCESS_TOKEN_KEY as string;
  const accessToken = jwt.sign(
    {
      userId: user.id,
      userPosition: user.type
    },
    accessKey,
    {
      // expiresIn: `${accessHours}h`
      expiresIn: `${accessHours}h`
    }
  );

  // gen refresh token
  const refreshKey = process.env.REFRESH_TOKEN_KEY as string;
  const refreshToken = jwt.sign(
    {
      userId: user.id,
      userPosition: user.type
    },
    refreshKey,
    {
      expiresIn: `${refreshDays}d`
    }
  );

  return { accessToken, refreshToken };
};

const checkStatusAndMessage = ({
  message
}: {
  message: string;
}): { status: number; message: string; subMessage?: string } => {
  if (message.toLowerCase().includes('prisma')) {
    const splittedMessage = message.toLowerCase().split(' ');

    const errorField =
      splittedMessage[splittedMessage.length - 1].split('_')[1];
    if (splittedMessage.includes('invocation:\n\n\nunique')) {
      return {
        status: 400,
        message: constantMessages.DUPLICATE,
        subMessage: `${
          errorField.charAt(0).toUpperCase() + errorField.slice(1)
        } existed`
      };
    }
    return {
      status: 500,
      message: constantMessages.INTERNAL_SERVER_ERROR
    };
  } else if (message.toLowerCase().includes('not found')) {
    return {
      status: 404,
      message: constantMessages.NOT_FOUND
    };
  } else if (
    message.toLowerCase().includes('invalid') ||
    message.toLowerCase().includes('not valid')
  ) {
    return {
      status: 400,
      message: constantMessages.INVALID
    };
  } else if (
    message.toLowerCase().includes('duplicate') ||
    message.toLowerCase().includes('exist')
  ) {
    return {
      status: 400,
      message: constantMessages.DUPLICATE
    };
  }
  return {
    status: 400,
    message: constantMessages.BAD_REQUEST
  };
};

const checkType = (value: any): string =>
  Object.prototype.toString.call(value).slice(8, -1);

const pickKeysInObject = <T extends object, K extends keyof T>({
  object,
  keys
}: {
  object: T;
  keys: K[];
}) =>
  keys.reduce(
    (result, key) => {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        result[key] = object[key];
      }
      return result;
    },
    {} as Pick<T, K>
  );

const generateKey = () => crypto.randomBytes(64).toString('hex');

const convertArrayToObject = (array: Array<any>) => {
  return array.reduce((obj, item) => ({ ...obj, [`${item}`]: 1 }), {});
};

interface NestedObject {
  [key: string]: any;
}
const updateNestedObjectParse = (object: NestedObject): NestedObject => {
  if (object === null || typeof object !== 'object') {
    return object;
  }
  const updatedObject: NestedObject = {};
  Object.entries(object).forEach(([key, value]) => {
    if (value !== null) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        const nestedUpdates = updateNestedObjectParse(value);
        for (const nestedKey in nestedUpdates) {
          updatedObject[`${key}.${nestedKey}`] = nestedUpdates[nestedKey];
        }
      } else {
        updatedObject[key] = value;
      }
    }
  });
  return updatedObject;
};

export {
  updateNestedObjectParse,
  convertArrayToObject,
  generateKey,
  pickKeysInObject,
  checkType,
  checkStatusAndMessage,
  getTokens
};
