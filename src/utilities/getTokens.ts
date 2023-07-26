import jwt from "jsonwebtoken";

const refreshHours = "72"; // 3 days
const accessHours = "2"; // 2 hrs

export const getTokens = (response: any) => {
  // gen access token
  const accessKey = process.env.ACCESS_TOKEN_KEY as string;
  const accessToken = jwt.sign(
    {
      userId: response.id,
      userPosition: response.position,
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
      userId: response.id,
      userPosition: response.position,
    },
    refreshKey,
    {
      expiresIn: `${refreshHours}h`,
    }
  );

  return { accessToken, refreshToken };
};
