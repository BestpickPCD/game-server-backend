import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import { default as helmet } from 'helmet';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import router from './routes/index.ts';
import userSwagger from './swagger/index.ts';
import logger from './utilities/log/index.ts';
import { mysqlConnection, mongodbConnection } from './config/prisma/index.ts';

dotenv.config();

const app = express();
const server = createServer(app);

const swaggerSpec = swaggerJSDoc(userSwagger);

//init middleware
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

mysqlConnection;
mongodbConnection;

app.use('/', router);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
//handle error
app.use((req, res, next) => {
  const error = new Error('Not found');
  (error as any).statusCode = 404;
  next(error);
});

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = error.statusCode || '500';
  const message = error.message || 'Internal Server Error';
  logger.error({
    userId: (req as any)?.user?.id || '',
    method: req.method,
    url: req.url,
    body: req.body,
    params: req.params,
    status: statusCode,
    message,
    subMessage: error?.subMessage
  });
  return res.status(statusCode).json({
    status: 'Error',
    code: statusCode,
    ...(error.subMessage && { subMessage: error.subMessage }),
    message: error.message || 'Internal Server Error'
  });
});
//
export const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3100',
      'http://localhost:3000',
      'http://localhost:3200',
      'http://167.99.68.34:3100'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  io.emit('message', 'A new client has connected');
});

export default server;
