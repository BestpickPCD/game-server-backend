import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import router from './routes/index.js'; // Use .js extension
import userSwagger from './swagger/index.js'; // Use .js extension

dotenv.config();


const app = express();
const port = process.env.PORT;

const swaggerSpec = swaggerJSDoc(userSwagger);

app.use(express.static('public'))
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.set('view engine', 'ejs');

app.use('/', router);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
