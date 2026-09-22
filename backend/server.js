require("dotenv").config();

const express = require("express");
const cors = require("cors");

const pool = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const fraudRoutes = require("./routes/fraudRoutes");
const historyRoutes = require("./routes/historyRoutes");

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());

// ==========================================
// ROUTES
// ==========================================

// Authentication
app.use("/api/auth", authRoutes);

// Protected routes
app.use("/api", protectedRoutes);

// Fraud analysis
app.use("/api/fraud", fraudRoutes);

// Analysis history
app.use("/api", historyRoutes);

// ==========================================
// BASIC SERVER TEST
// ==========================================

app.get("/", (req, res) => {
    res.json({
        message: "Fraud Detection Backend is running"
    });
});

// ==========================================
// DATABASE TEST
// ==========================================

app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            message: "PostgreSQL connected successfully",
            time: result.rows[0].now
        });

    } catch (error) {
        console.error(
            "Database connection error:",
            error
        );

        res.status(500).json({
            message: "Database connection failed"
        });
    }
});

// ==========================================
// CREATE TRANSACTION
// ==========================================

app.post("/api/transactions", async (req, res) => {
    try {
        const {
            transaction_id,
            amount,
            currency
        } = req.body;

        if (!transaction_id) {
            return res.status(400).json({
                message: "Transaction ID is required"
            });
        }

        const result = await pool.query(
            `INSERT INTO transactions
            (
                transaction_id,
                amount,
                currency
            )
            VALUES ($1, $2, $3)
            RETURNING *`,
            [
                transaction_id,
                amount,
                currency
            ]
        );

        res.status(201).json({
            message: "Transaction created successfully",
            transaction: result.rows[0]
        });

    } catch (error) {
        console.error(
            "Transaction insert error:",
            error
        );

        // Duplicate transaction ID
        if (error.code === "23505") {
            return res.status(409).json({
                message: "Transaction ID already exists"
            });
        }

        res.status(500).json({
            message: "Failed to create transaction"
        });
    }
});

// ==========================================
// GET TRANSACTIONS
// ==========================================

app.get("/api/transactions", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
             FROM transactions
             ORDER BY created_at DESC`
        );

        res.json(result.rows);

    } catch (error) {
        console.error(
            "Transaction fetch error:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch transactions"
        });
    }
});

// ==========================================
// SERVER
// ==========================================

const PORT = 5001;

app.listen(PORT, () => {
    console.log(
        `Server running on port ${PORT}`
    );
});