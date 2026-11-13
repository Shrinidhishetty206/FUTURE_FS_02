
const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String
    },
    company: {
        type: String
    },
    status: {
        type: String,
        enum: ["New", "Contacted", "Qualified", "Converted", "Lost"],
        default: "New"
    },
    source: {
        type: String,
        default: "Website"
    }
}, { timestamps: true });

module.exports = mongoose.model("Lead", leadSchema);
