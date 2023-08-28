import jwt from 'jsonwebtoken';
import { Users } from '@prisma/client';
import { message as constantMessages } from './constants/index.ts';

const refreshDays = '7'; // 3 days
const accessHours = '2'; // 2 hrs

export const getTokens = (
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

export const checkStatusAndMessage = ({
  message
}: {
  message: string;
}): { status: number; message: string; subMessage?: string } => {
  if (message.toLowerCase().includes('prisma')) {
    const splittedMessage = message.toLowerCase().split(' ');
    console.log(message.toLowerCase());

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
