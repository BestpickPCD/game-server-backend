import jwt from "jsonwebtoken";
import { Users } from "@prisma/client";

const refreshHours = "72"; // 3 days
const accessHours = "2"; // 2 hrs

export const getTokens = (user: Users): any => {
  // gen access token
  const accessKey = process.env.ACCESS_TOKEN_KEY as string;
  const accessToken = jwt.sign(
    {
      userId: user.id,
      userPosition: user.type,
    },
    accessKey,
    {
      expiresIn: `${accessHours}h`,
    }
  );

  // gen refresh token
  const refreshKey = process.env.REFRESH_TOKEN_KEY as string;
  const refreshToken = jwt.sign(
    {
      userId: user.id,
      userPosition: user.type,
    },
    refreshKey,
    {
      expiresIn: `${refreshHours}h`,
    }
  );

  return { accessToken, refreshToken };
};


