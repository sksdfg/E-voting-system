const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const path = require("path");
const redis = require("redis");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// MySQL DB connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err.stack);
        return;
    }
    console.log("Connected to MySQL database");
});


const redisClient = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: process.env.REDIS_PORT || 6379,
    },
});

redisClient
    .connect()
    .then(() => console.log("Connected to Redis"))
    .catch((err) => console.error("Redis connection error:", err));

// Serve HTML
app.get("/partyInfo", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "partyInfo.html"));
});


app.post("/login", (req, res) => {
    const { voterId, username, password } = req.body;
    const sql = "SELECT id, name, region, has_voted FROM voters WHERE id = ? AND user = ? AND password = ?";

    db.query(sql, [voterId, username, password], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });

        if (results.length > 0) {
            res.json({ success: true, ...results[0] });
        } else {
            res.json({ success: false, message: "Invalid credentials" });
        }
    });
});


app.get("/candidates", async (req, res) => {
    const { region } = req.query;

    try {
        const cacheKey = `candidates:${region}`;
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            console.log("Serving from Redis cache");
            return res.json(JSON.parse(cachedData));
        }

        const sql = "SELECT candidate_id, name, party_id, image_url FROM candidates WHERE region = ?";
        db.query(sql, [region], async (err, results) => {
            if (err) return res.status(500).json({ success: false, message: "Database error" });

            await redisClient.setEx(cacheKey, 300, JSON.stringify(results)); // Cache for 5 minutes
            res.json(results);
        });
    } catch (err) {
        console.error("Error with Redis or DB:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


app.post("/vote", (req, res) => {
    const { voterId, partyId, region } = req.body;

    if (!voterId || !partyId || !region) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const voteSql = "INSERT INTO votes (voter_id, party_id, region) VALUES (?, ?, ?)";
    db.query(voteSql, [voterId, partyId, region], (err) => {
        if (err) {
            console.error("Vote Insertion Error:", err);
            return res.status(500).json({ success: false, message: "Database error: Unable to record vote" });
        }

        const updateSql = "UPDATE voters SET has_voted = 1 WHERE id = ?";
        db.query(updateSql, [voterId], async (err) => {
            if (err) {
                console.error("Voter Update Error:", err);
                return res.status(500).json({ success: false, message: "Database error: Unable to update voter status" });
            }

            
            await redisClient.del(`candidates:${region}`);
            res.json({ success: true, message: "Vote recorded successfully!" });
        });
    });
});


app.post("/signUp", (req, res) => {
    const { name, user, password, region } = req.body;

    if (!name || !user || !password || !region) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const sql = "INSERT INTO voters (name, user, password, region, has_voted) VALUES (?, ?, ?, ?, 0)";
    db.query(sql, [name, user, password, region], (err) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });

        res.json({ success: true, message: "User registered successfully!" });
    });
});

app.get("/api/partyInfo", (req, res) => {
    const sql = "SELECT party_name, image_url, manifesto FROM parties";

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database query error" });
        }

        const formattedResults = results.map((party) => ({
            party_name: party.party_name,
            image_url: party.image_url,
            manifesto: party.manifesto ? party.manifesto.toString("utf-8") : "No manifesto available",
        }));

        res.json(formattedResults);
    });
});

app.post("/register", (req, res) => {
    const { name, user, password, region } = req.body;

    if (!name?.trim() || !user?.trim() || !password?.trim() || !region?.trim()) {
        return res.status(400).json({ message: "All fields are required." });
    }

    const query = "INSERT INTO voters (name, user, password, region) VALUES (?, ?, ?, ?)";
    db.query(query, [name, user, password, region], (err) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        res.json({ message: "Voter registered successfully!" });
    });
});

app.post("/updateUserInfo", (req, res) => {
    const { voterId, oldPassword, newUsername, newPassword, newName } = req.body;

    if (!voterId || !oldPassword || !newUsername || !newPassword) {
        return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    db.query("SELECT * FROM voters WHERE id = ? AND password = ?", [voterId, oldPassword], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });

        if (result.length === 0) {
            return res.status(401).json({ success: false, message: "Please enter a valid password" });
        }

        db.query(
            "UPDATE voters SET name = ?, user = ?, password = ? WHERE id = ?",
            [newName, newUsername, newPassword, voterId],
            (updateErr, updateResult) => {
                if (updateErr) return res.status(500).json({ success: false, message: "Failed to update user info" });

                if (updateResult.affectedRows > 0) {
                    res.json({ success: true, message: "Login details updated successfully!" });
                } else {
                    res.status(400).json({ success: false, message: "Failed to update login details" });
                }
            }
        );
    });
});


let electionComplete = false;
if (electionComplete) {
     getCount(); 
}

app.listen(3000, "0.0.0.0", () => {
    console.log("Server running on port 3000");
});
