import dotenv from "dotenv";
import express from "express";
import router from "./routes/index.ts";

const app = express();
dotenv.config();
app.use(express.json());
app.use("/", router);

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
