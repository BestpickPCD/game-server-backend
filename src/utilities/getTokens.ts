import jwt from "jsonwebtoken";

const refreshHours = "72"; // 3 days
const accessHours = "2"; // 2 hrs

export const getTokens = (userId: number) => {
  // gen access token
  const accessKey = process.env.ACCESS_TOKEN_KEY as string;
  const accessToken = jwt.sign(
    {
      userId,
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
      userId,
    },
    refreshKey,
    {
      expiresIn: `${refreshHours}h`,
    }
  );

  return { accessToken, refreshToken };
};
