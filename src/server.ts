import dotenv from 'dotenv';
import express from 'express';
import router from './routes/index.ts';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import userSwagger from './swagger/index.ts';
import redisClient from './config/redis/index.ts';
dotenv.config();
const app = express();
const port = process.env.PORT;

const swaggerSpec = swaggerJSDoc(userSwagger);

app.use(cors());
app.use(express.json());
app.use('/', router);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

redisClient
  .connect()
  .then(() => {
    console.log('Redis Connected');
  })
  .catch((err) => {
    console.log('Redis connection failed', err);
  });
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
