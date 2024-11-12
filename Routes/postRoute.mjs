import { Router } from "express";
import validatePostData from "../middlewares/validatePostData.mjs";
import connectionPool from "../utils/db.mjs";

const postRoute = Router()

// PostRoute.get("/posts", async (req, res) => {

//   let displayPost;

//   try {
//     displayPost = await connectionPool.query(`SELECT * FROM posts`);

//     return res.status(200).json(displayPost.rows);
//   } catch {
//     return res.status(500).json({
//       message: "Server could not read post because database connection",
//     });
//   }
// });


 postRoute.get("/", async   (req, res) => {
    // ลอจิกในอ่านข้อมูลโพสต์ทั้งหมดในระบบ
    try {
      // 1) Access ข้อมูลใน Body จาก Request ด้วย req.body
      const category = req.query.category || "";
      const keyword = req.query.keyword || "";
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 6;
      // 2) ทำให้แน่ใจว่า query parameter page และ limit จะมีค่าอย่างต่ำเป็น 1
      const safePage = Math.max(1, page);
      const safeLimit = Math.max(1, Math.min(100, limit));
      const offset = (safePage - 1) * safeLimit;
      // offset คือค่าที่ใช้ในการข้ามจำนวนข้อมูลบางส่วนตอน query ข้อมูลจาก database
      // ถ้า page = 2 และ limit = 6 จะได้ offset = (2 - 1) * 6 = 6 หมายความว่าต้องข้ามแถวไป 6 แถวแรก และดึงแถวที่ 7-12 แทน
      // 3) เขียน Query เพื่อ Insert ข้อมูลโพสต์ ด้วย Connection Pool
      let query = `
        SELECT posts.id, posts.image, categories.name AS category, posts.title, posts.description, posts.date, posts.content, statuses.status, posts.likes_count
        FROM posts
        INNER JOIN categories ON posts.category_id = categories.id
        INNER JOIN statuses ON posts.status_id = statuses.id
      `;
      let values = [];
      // 4) เขียน query จากเงื่อนไขของการใส่ query parameter category และ keyword
      if (category && keyword) {
        query += `
          WHERE categories.name ILIKE $1 
          AND (posts.title ILIKE $2 OR posts.description ILIKE $2 OR posts.content ILIKE $2)
        `;
        values = [`%${category}%`, `%${keyword}%`];
      } else if (category) {
        query += " WHERE categories.name ILIKE $1";
        values = [`%${category}%`];
      } else if (keyword) {
        query += `
          WHERE posts.title ILIKE $1 
          OR posts.description ILIKE $1 
          OR posts.content ILIKE $1
        `;
        values = [`%${keyword}%`];
      }
      // 5) เพิ่มการ odering ตามวันที่, limit และ offset
      query += ` ORDER BY posts.date DESC LIMIT $${values.length + 1} OFFSET $${
        values.length + 2
      }`;
      values.push(safeLimit, offset);
      // 6) Execute the main query (ดึงข้อมูลของบทความ)
      const result = await connectionPool.query(query, values);
      // 7) สร้าง Query สำหรับนับจำนวนทั้งหมดตามเงื่อนไข พื่อใช้สำหรับ pagination metadata
      let countQuery = `
        SELECT COUNT(*)
        FROM posts
        INNER JOIN categories ON posts.category_id = categories.id
        INNER JOIN statuses ON posts.status_id = statuses.id
      `;
      let countValues = values.slice(0, -2); // ลบค่า limit และ offset ออกจาก values
      if (category && keyword) {
        countQuery += `
          WHERE categories.name ILIKE $1 
          AND (posts.title ILIKE $2 OR posts.description ILIKE $2 OR posts.content ILIKE $2)
        `;
      } else if (category) {
        countQuery += " WHERE categories.name ILIKE $1";
      } else if (keyword) {
        countQuery += `
          WHERE posts.title ILIKE $1 
          OR posts.description ILIKE $1 
          OR posts.content ILIKE $1
        `;
      }
      const countResult = await connectionPool.query(countQuery, countValues);
      const totalPosts = parseInt(countResult.rows[0].count, 10);
      // 8) สร้าง response พร้อมข้อมูลการแบ่งหน้า (pagination)
      const results = {
        totalPosts,
        totalPages: Math.ceil(totalPosts / safeLimit),
        currentPage: safePage,
        limit: safeLimit,
        posts: result.rows,
      };
      // เช็คว่ามีหน้าถัดไปหรือไม่
      if (offset + safeLimit < totalPosts) {
        results.nextPage = safePage + 1;
      }
      // เช็คว่ามีหน้าก่อนหน้าหรือไม่
      if (offset > 0) {
        results.previousPage = safePage - 1;
      }
      // 9) Return ตัว Response กลับไปหา Client ว่าสร้างสำเร็จ
      return res.status(200).json(results);
    } catch {
      return res.status(500).json({
        message: "Server could not read post because database issue",
      });
    }
  });
  
  
  
  postRoute.get("/:postId", async (req, res) => {
    const postIdFromClient = req.params.postId;
    try {
      const results = await connectionPool.query(
        `SELECT * FROM posts WHERE id = $1`, 
        [postIdFromClient]  // แยก array ของพารามิเตอร์ออกจาก SQL query
      );
  
      if (!results.rows[0]) {
        return res.status(404).json({
          message: `Server could not find a requested post (postId: ${postIdFromClient})`
        });
      }
  
      return res.status(200).json({
        data: results.rows[0],
      });
    } catch (error) {
      console.error("Error reading post:", error.message);
      return res.status(500).json({
        message: "Server could not read post due to a database error",
        error: error.message,  // เพิ่ม error.message เพื่อแสดงข้อผิดพลาด
      });
    }
  });
  
  
  postRoute.post("/", [validate  PostData],  async (req, res) => {
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
  
  
  postRoute.put("/:postId", [validatePostData],  async (req, res) => {
  
    const postId = req.params.postId;
  
    const updatePost = {...req.body, updated_at: new Date() }
    /// 1. access body form  >>>> const addNewPosts = req.body;
    try {
      const queryUpdetepost = `
        UPDATE posts
              SET title = $2, 
              image = $3, 
              category_id = $4, 
              description = $5, 
              content = $6, 
              status_id = $7
        WHERE id = $1;`;
  
        const valuesUpdatepost = [
          postId,
          updatePost.title,
          updatePost.image,
          updatePost.category_id,
          updatePost.description,
          updatePost.content,
          updatePost.status_id
        ];
  
  
        // { body
        //   "title": "Mastering Time Management: Techniques for Success",
        //   "image": "https://res.cloudinary.com/dcbpjtd1r/image/upload/v1728449771/my-blog-post/g8qpepvgnz6gioylyhrz.jpg",
        //   "category_id": 2,
        //   "description": "Learn effective time management strategies to help you stay organized, reduce stress, and achieve your goals.",
        //   "content": "## 1. The Importance of Time Management\n\nUnderstanding why managing your time effectively is crucial for personal and professional success.\n\n## 2. Prioritization Techniques\n\nLearn how to prioritize tasks to focus on what matters most.\n\n## 3. Using Tools to Organize\n\nDiscover apps and methods to keep your tasks and goals organized.\n\n## 4. Setting Realistic Goals\n\nUnderstand the importance of setting achievable goals and breaking them down into manageable steps.\n\n## 5. Balancing Work and Life\n\nTips for maintaining a healthy work-life balance to avoid burnout and stay productive.",
        //   "status_id": 1
        // }
      
      await connectionPool.query(queryUpdetepost, valuesUpdatepost); /// 2. connection pool execute function 
  
      return res.status(200).json({
        /// 3. return respond to client 
        message: "Updated post sucessfully",
      });
  
    } catch {
      return res.status(404).json({
        message: "Server could not find a requested post to update"
      });
    }
  });
  
  
  postRoute.delete("/:postId", async (req, res) => {
    const postId = req.params.postId;
    
    try {
      const queryDeletedpost = `
        DELETE FROM posts
        WHERE id = $1;
      `;
  
      const valuesDeletepost = [postId]; 
  
      const result = await connectionPool.query(queryDeletedpost, valuesDeletepost);
  
      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Post not found",
        });
      }
  
      return res.status(200).json({
        message: "Deleted post successfully",
      });
  
    } catch (error) {
      return res.status(500).json({
        message: "Server could not delete post because of a database connection error",
        error: error.message,
      });
    }
  });

  export default postRoute;

