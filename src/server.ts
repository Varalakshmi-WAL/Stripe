import express from 'express';
import dotenv from "dotenv";
dotenv.config();
import cors from 'cors';


const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payments/webhook") {
    next(); // Skip express.json() for the /webhook route
  } else {
    express.json()(req, res, next); // Apply express.json() to all other routes
  }
});

// Routes
app.use("/api/payments", paymentRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
