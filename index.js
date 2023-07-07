const dbConnection = require("./connection").db;
const express = require("express");
const bodyParser = require("body-parser");
const uuid = require("uuid");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

// Generate Token for Student A
app.post("/api/login", (req, res) => {
  const { universityId, password } = req.body;

  const query =
    "SELECT * FROM students WHERE university_id = ? AND password = ?";
  dbConnection.query(query, [universityId, password], (err, results) => {
    if (err) {
      console.error("Error executing MySQL query:", err);
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    if (results.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = uuid.v4();
    const studentId = results[0].id;

    const insertTokenQuery =
      "INSERT INTO tokens (student_id, token) VALUES (?, ?)";
    dbConnection.query(insertTokenQuery, [studentId, token], (err) => {
      if (err) {
        console.error("Error executing MySQL query:", err);
        res.status(500).json({ error: "Internal server error" });
        return;
      }

      res.json({ token });
    });
  });
});

// Get List of Free Sessions with the Dean
app.get("/api/sessions", (req, res) => {
  const query = "SELECT * FROM sessions";
  dbConnection.query(query, (err, results) => {
    if (err) {
      console.error("Error executing MySQL query:", err);
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    const sessions = results.map((row) => ({ time: row.time }));
    res.json({ sessions });
  });
});

// Book a Session with the Dean
app.post("/api/book", (req, res) => {
  const { token } = req.headers;
  const { time } = req.body;

  const findStudentQuery = `SELECT student_id FROM tokens WHERE token = '${token}'`;
  dbConnection.query(findStudentQuery, [token], (err, results) => {
    if (err) {
      console.error("Error executing MySQL query:", err);
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    if (results.length === 0) {
      res.status(401).json({ error: `Invalid token` });
      return;
    }

    const studentId = results[0].student_id;

    const insertBookingQuery = `INSERT INTO bookings (student_id, time) VALUES (${studentId}, '${time}')`;
    dbConnection.query(insertBookingQuery, [studentId, time], (err) => {
      if (err) {
        console.error("Error executing MySQL query:", err);
        res.status(500).json({ error: "Internal server error" });
        return;
      }

      res.json({ message: "Session booked successfully" });
    });
  });
});

// Generate Token for the Dean
app.post("/api/login-dean", (req, res) => {
  const { universityId, password } = req.body;

  const query = "SELECT * FROM deans WHERE university_id = ? AND password = ?";
  dbConnection.query(query, [universityId, password], (err, results) => {
    if (err) {
      console.error("Error executing MySQL query:", err);
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    if (results.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = uuid.v4();
    const deanId = results[0].id;

    const insertTokenQuery =
      "INSERT INTO tokens (dean_id, token) VALUES (?, ?)";
    dbConnection.query(insertTokenQuery, [deanId, token], (err) => {
      if (err) {
        console.error("Error executing MySQL query:", err);
        res.status(500).json({ error: "Internal server error" });
        return;
      }

      res.json({ token });
    });
  });
});

// Get List of Pending Sessions for the Dean
app.get("/api/pending-sessions", (req, res) => {
  const { token } = req.headers;

  const findDeanQuery = `SELECT dean_id FROM tokens WHERE token = '${token}'`;
  dbConnection.query(findDeanQuery, [token], (err, results) => {
    if (err) {
      console.error("Error executing MySQL query:", err);
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    if (results.length === 0) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const deanId = results[0].id;

    const query =
      "SELECT s.university_id AS studentUniversityId, b.time FROM bookings b JOIN students s ON b.student_id = s.id";
    dbConnection.query(query, (err, results) => {
      if (err) {
        console.error("Error executing MySQL query:", err);
        res.status(500).json({ error: "Internal server error" });
        return;
      }

      const sessions = results.map((row) => ({
        studentUniversityId: row.studentUniversityId,
        time: row.time,
      }));
      res.json({ sessions });
    });
  });
});

// Start the server
app.listen(process.env.PORT, () => {
  console.log("Server started on port:", process.env.PORT);
});
