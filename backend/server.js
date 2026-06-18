const express = require("express");
const multer = require("multer");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const nodemailer = require("nodemailer");
const pool = require("./db");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "_" + file.originalname;
    cb(null, uniqueName);
  }
});

const fileFilter = function (req, file, cb) {
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "image/png",
    "image/jpeg",
    "image/jpg"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, Word, Excel, CSV and image files are allowed"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter
});

app.get("/", function (req, res) {
  res.send("Data Analyst Portfolio Backend with PostgreSQL is running");
});

app.post("/api/documents/upload", upload.single("file"), async function (req, res) {
  try {
    const { title, category, description } = req.body;

    if (!title || !category || !description) {
      return res.status(400).json({
        message: "Title, category and description are required"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a file"
      });
    }

    const fileName = req.file.filename;
    const filePath = `/uploads/${req.file.filename}`;
    const fileType = req.file.mimetype;

    const query = `
      INSERT INTO documents 
      (title, category, description, file_name, file_path, file_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      title,
      category,
      description,
      fileName,
      filePath,
      fileType
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Document uploaded successfully",
      document: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      message: "Upload failed",
      error: error.message
    });
  }
});

app.get("/api/documents", async function (req, res) {
  try {
    const result = await pool.query(
      "SELECT * FROM documents ORDER BY created_at DESC"
    );

    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch documents",
      error: error.message
    });
  }
});

app.delete("/api/documents/:id", async function (req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM documents WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Document not found"
      });
    }

    res.status(200).json({
      message: "Document deleted successfully",
      document: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      message: "Delete failed",
      error: error.message
    });
  }
});

app.get("/api/projects", async function (req, res) {
  try {
    const result = await pool.query(
      "SELECT * FROM projects ORDER BY created_at DESC"
    );

    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch projects",
      error: error.message
    });
  }
});

app.post("/api/projects", async function (req, res) {
  try {
    const { title, category, tools, description, insight, project_link, image_url } = req.body;

    if (!title || !category || !tools || !description) {
      return res.status(400).json({
        message: "Title, category, tools and description are required"
      });
    }

    const query = `
      INSERT INTO projects 
      (title, category, tools, description, insight, project_link, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      title,
      category,
      tools,
      description,
      insight || "",
      project_link || "",
      image_url || ""
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Project added successfully",
      project: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not add project",
      error: error.message
    });
  }
});

app.post("/api/messages", async function (req, res) {
  try {
    const { full_name, email, subject, message } = req.body;

    if (!full_name || !email || !message) {
      return res.status(400).json({
        message: "Full name, email and message are required"
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.RECEIVER_EMAIL,
      replyTo: email,
      subject: subject || "New message from Data Analyst Portfolio",
      html: `
        <h2>New Portfolio Contact Message</h2>

        <p><strong>Name:</strong> ${full_name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || "No subject"}</p>

        <hr />

        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "Message sent successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Message could not be sent",
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, function () {
  console.log(`Server running on port ${PORT}`);
});