require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const app = express();
const protectedRoutes = require("./routes/protectedRoutes");
const fraudRoutes = require("./routes/fraudRoutes");
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", protectedRoutes);
app.use("/api/fraud", fraudRoutes);
app.get("/", (req, res) => {
    res.json({
        message: "Fraud Detection Backend is running"
    });
});

app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            message: "PostgreSQL connected successfully",
            time: result.rows[0].now
        });
    } catch (error) {
        console.error("Database connection error:", error);

        res.status(500).json({
            message: "Database connection failed"
        });
    }
});
app.post("/api/transactions", async (req, res) => {
    try {
        const { transaction_id, amount, currency } = req.body;

        const result = await pool.query(
            `INSERT INTO transactions (transaction_id, amount, currency)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [transaction_id, amount, currency]
        );

        res.status(201).json({
            message: "Transaction created successfully",
            transaction: result.rows[0]
        });

    } catch (error) {
        console.error("Transaction insert error:", error);

        res.status(500).json({
            message: "Failed to create transaction"
        });
    }
});

const PORT = 5001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});