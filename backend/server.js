
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully!");
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error.message);
  });

// Lead Schema
const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: "",
    },
    company: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["New", "Contacted", "Qualified", "Converted", "Lost"],
      default: "New",
    },
    source: {
      type: String,
      default: "Website",
    },
  },
  { timestamps: true }
);

const Lead = mongoose.model("Lead", leadSchema);

// Home route
app.get("/", (req, res) => {
  res.send("CRM Backend is running!");
});

// Get all leads
app.get("/api/leads", async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get one lead
app.get("/api/leads/:id", async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.json(lead);
  } catch (error) {
    res.status(400).json({ message: "Invalid lead ID" });
  }
});

// Add lead
app.post("/api/leads", async (req, res) => {
  try {
    const { name, email, phone, company, status, source } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required",
      });
    }

    const lead = await Lead.create({
      name,
      email,
      phone,
      company,
      status,
      source,
    });

    res.status(201).json({
      message: "Lead added successfully",
      lead,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update lead
app.put("/api/leads/:id", async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.json({
      message: "Lead updated successfully",
      lead,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete lead
app.delete("/api/leads/:id", async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.json({
      message: "Lead deleted successfully",
    });
  } catch (error) {
    res.status(400).json({ message: "Invalid lead ID" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
