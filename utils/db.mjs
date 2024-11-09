import * as pg  from "pg";

const { Pool } = pg.default;

const connectionPool = new Pool({
    connectionString: "postgresql://postgres:05590547eis@localhost:5432/my-personal-blog-db"
});
export default connectionPool;