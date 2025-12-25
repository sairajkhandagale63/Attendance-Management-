const express = require("express");
const router = express.Router();
const db = require("../db");

// ---------------- CHECK-IN ----------------
router.post("/checkin", (req, res) => {
  const { mobile, image } = req.body;

  if (!mobile || !image) {
    return res.status(400).json({ message: "Mobile & image required" });
  }

  // 1. Verify Employee
  db.query("SELECT * FROM employees WHERE mobile = ?", [mobile], (err, emp) => {
    if (err) {
      console.error("DB Error (Find Employee):", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (emp.length === 0) {
      return res.status(404).json({ message: "Employee not found. Please contact admin." });
    }

    const employee = emp[0];

    // 2. Check if already checked in TODAY
    db.query(
      `SELECT * FROM attendance 
       WHERE employee_id = ? 
       AND DATE(check_in) = CURDATE()`,
      [employee.id],
      (err, rows) => {
        if (err) {
          console.error("DB Error (Check Existing):", err);
          return res.status(500).json({ message: "Database error" });
        }

        if (rows.length > 0) {
          return res.status(400).json({ message: "Already checked-in today!" });
        }

        // Handle Image Save to Disk
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, '../uploads');

        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir);
        }

        // Parse Base64
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let imageUrl = image; // Fallback to base64 if match fails (unlikely if valid)

        if (matches && matches.length === 3) {
          const type = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const extension = type.split('/')[1] || 'jpg';
          const filename = `${mobile}_${Date.now()}.${extension}`;
          const filepath = path.join(uploadsDir, filename);

          try {
            fs.writeFileSync(filepath, buffer);
            imageUrl = `http://localhost:8080/uploads/${filename}`;
          } catch (saveErr) {
            console.error("Image Save Error:", saveErr);
            // Proceed with base64 or fail? 
            // Let's fallback to base64 to ensure data isn't lost, or fail. 
            // Given "unwanted content" is the user complaint, we prefer failing or logging.
            // We'll keep imageUrl as base64 on error just in case.
          }
        }

        // 3. Insert Check-in
        db.query(
          `INSERT INTO attendance 
          (employee_id, user_name, user_mobile, check_in, image, created_at)
          VALUES (?, ?, ?, NOW(), ?, NOW())`,
          [employee.id, employee.name, employee.mobile, imageUrl],
          (err, result) => {
            if (err) {
              console.error("DB Error (Insert Attendance):", err);
              if (err.code === 'ER_DATA_TOO_LONG') {
                return res.status(500).json({ message: "Image data too large" });
              }
              return res.status(500).json({ message: "Failed to save attendance" });
            }
            res.json({ message: "Check-in successful" });
          }
        );
      }
    );
  });
});

// ---------------- CHECK-OUT ----------------
router.post("/checkout", (req, res) => {
  const { mobile } = req.body;

  if (!mobile) return res.status(400).json({ message: "Mobile required" });

  db.query("SELECT id FROM employees WHERE mobile = ?", [mobile], (err, emp) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (emp.length === 0) return res.status(404).json({ message: "Employee not found" });

    const empId = emp[0].id;

    // Check if already checked out
    db.query(
      `SELECT * FROM attendance 
       WHERE employee_id = ? 
       AND DATE(check_in) = CURDATE()`,
      [empId],
      (err, rows) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (rows.length === 0) return res.status(400).json({ message: "No check-in record found for today." });

        const record = rows[0];
        if (record.check_out) {
          return res.status(400).json({ message: "Already checked-out today!" });
        }

        db.query(
          `UPDATE attendance 
           SET check_out = NOW()
           WHERE id = ?`,
          [record.id],
          (err, result) => {
            if (err) {
              console.error("DB Error (Update Checkout):", err);
              return res.status(500).json({ message: "Failed to checkout" });
            }
            res.json({ message: "Check-out successful" });
          }
        );
      }
    );
  });
});

// ---------------- EMPLOYEE RECORD ----------------
router.get("/employee/:mobile", (req, res) => {
  const mobile = req.params.mobile;

  db.query(`SELECT * FROM attendance WHERE user_mobile = ? ORDER BY check_in DESC`, [mobile], (err, rows) => {
    res.json(rows);
  });
});

// ---------------- LOGIN ----------------
router.post("/login", (req, res) => {
  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ message: "Mobile and Password required" });
  }

  db.query(
    "SELECT * FROM employees WHERE mobile = ? AND password = ?",
    [mobile, password],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Database error" });

      if (rows.length === 0) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const user = rows[0];
      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          mobile: user.mobile,
          role: user.role
        }
      });
    }
  );
});

// ---------------- ADMIN ----------------
router.get("/all", (req, res) => {
  db.query(
    `SELECT a.*, e.name as emp_name 
     FROM attendance a
     LEFT JOIN employees e ON a.employee_id = e.id
     ORDER BY check_in DESC`,
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

module.exports = router;
