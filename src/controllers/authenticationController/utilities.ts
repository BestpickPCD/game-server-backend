import jwt from 'jsonwebtoken';

export const generateApiKey = async (userId: string): Promise<any> => {
  const secretKey = process.env.SECRET_KEY ?? '';
  const payload = {
    userId
  };

  const token = jwt.sign(payload, secretKey);

  return token;
};
