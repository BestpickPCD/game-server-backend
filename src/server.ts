import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import router from './routes/index.ts';
import userSwagger from './swagger/index.ts';
import logger from './utilities/log/index.ts';
import { checkStatusAndMessage } from './utilities/index.ts';

import { connect } from './config/mongoose/index.ts';
connect();
dotenv.config();

const app = express();
const port = process.env.PORT;

const swaggerSpec = swaggerJSDoc(userSwagger);
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.set('view engine', 'ejs');

const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  _next: NextFunction
): Response<{
  message?: string;
  subMessage?: string;
}> => {
  const { status, message, subMessage } = checkStatusAndMessage(error);
  logger.error({
    userId: (req as any)?.user.id,
    url: `${req.baseUrl}${req.url}`,
    body: req.body,
    query: req.query,
    status,
    message: error.message
  });
  return res.status(status).json({
    message,
    ...(status !== 500 && { subMessage: subMessage || error.message })
  });
};

app.use('/', router);
app.use(errorHandler);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
