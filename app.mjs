import express from "express";
import cors from "cors";
import postRoute from "./Routes/postRoute.mjs";
const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use("/posts",postRoute);

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
