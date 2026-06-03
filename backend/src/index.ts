import cors from "cors";
import express from "express";

const app = express();
const PORT = process.env.PORT ?? 3002;

app.use(cors());
app.use(express.json());

app.get("/api/hello", (_req, res) => {
  res.json({
    message: "Hello from the backend!",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
