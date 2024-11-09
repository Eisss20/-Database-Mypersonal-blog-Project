import express from "express";
import cors from "cors";
import connectionPool from "./utils/db.mjs";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

/// test method get
app.get("/posts", async (req, res) => {

  let displayPost;

  try {
    displayPost = await connectionPool.query(`SELECT * FROM posts`);

    return res.status(200).json(displayPost.rows);
  } catch {
    return res.status(500).json({
      message: "Server could not read post because database connection",
    });
  }
});

/// for method post /// 

app.post("/posts", async (req, res) => {
  const addNewPosts = req.body;
  /// 1. access body form  >>>> const addNewPosts = req.body;

  try {
    const queryNewpost = `insert into posts (title, image, category_id, description, content, status_id)
    values ($1, $2, $3, $4, $5, $6)`;

    const valuesNewpost = [
      addNewPosts.title,
      addNewPosts.image,
      addNewPosts.category_id,
      addNewPosts.description,
      addNewPosts.content,
      addNewPosts.status_id,
    ];

    await connectionPool.query(queryNewpost, valuesNewpost); /// 2. connection pool execute function 

    return res.status(201).json({
      /// 3. return respond to client 
      message: "Created post sucessfully",
    });

  } catch {
    return res.status(500).json({
      message: "Server could not create post because database connection",
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
