import jwt from 'jsonwebtoken';
import { Users } from '@prisma/client';

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
