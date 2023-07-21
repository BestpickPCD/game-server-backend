import dotenv from 'dotenv';
import express from 'express';
import router from './routes/index.ts';
import cors from 'cors';

dotenv.config();
const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use('/', router);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
