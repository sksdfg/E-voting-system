const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const path = require("path");  

//const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "dbt25_a1_pes2ug22cs648"
});
 




app.get('/partyInfo', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'partyInfo.html'));
});


db.connect(err => {
    if (err) {
        console.error("Database connection failed: " + err.stack);
        return;
    }
    console.log("Connected to MySQL database");
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

app.get("/candidates", (req, res) => {
    const { region } = req.query;
    const sql = "SELECT candidate_id, name, party_id, image_url FROM candidates WHERE region = ?";

    db.query(sql, [region], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });

        res.json(results);
    });
});

// Voting process
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
        db.query(updateSql, [voterId], (err) => {
            if (err) {
                console.error("Voter Update Error:", err);
                return res.status(500).json({ success: false, message: "Database error: Unable to update voter status" });
            }

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

    db.query(sql, [name, user, password, region], (err, result) => {
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
  
      // Convert Buffer manifesto to string
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
        console.log("All fields are required.");
        return res.status(400).json({ message: "All fields are required." });  // 
    }

    const query = "INSERT INTO voters (name, user, password, region) VALUES (?, ?, ?, ?)";
    db.query(query, [name, user, password, region], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        res.json({ message: "Voter registered successfully!" });
    });
});

app.post("/updateUserInfo", (req, res) => {
    const { voterId, oldPassword, newUsername, newPassword, newName } = req.body; 

    if (!voterId || !oldPassword || !newUsername || !newPassword) { 
        return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    db.query( 
        "SELECT * FROM voters WHERE `id` = ? AND `password` = ?",
        [voterId, oldPassword],
        (err, result) => {  
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ success: false, message: "Database error" });
            }

            if (result.length === 0) { 
                return res.status(401).json({ success: false, message: "please enter a valid password" });
            }

            
            db.query(
                "UPDATE voters SET `name` = ?, `user` = ?, `password` = ? WHERE `id` = ?", 
                [newName, newUsername, newPassword, voterId], 
                (updateErr, updateResult) => {
                    if (updateErr) {
                        console.error("Update error:", updateErr);
                        return res.status(500).json({ success: false, message: "Failed to update user info" });
                    }

                    if (updateResult.affectedRows > 0) {
                        return res.json({ success: true, message: "Login details updated successfully!" });
                    } else {
                        return res.status(400).json({ success: false, message: "Failed to update login details" });
                    }
                }
            );
        }
    );
});





let electionComplete = false;

if(electionComplete) {
    getCount();
}





app.listen(3000, '0.0.0.0' , () => console.log("Server running on port 3000"));
