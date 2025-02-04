const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const PORT = 3000;

require('dotenv').config();
const path=require('path');
const ejs=require('ejs');
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));
app.get('/',(req,res)=>{
    res.render('index');
});
// Mail.tm API URLs
const BASE_URL = "https://api.mail.tm";
let emailData = {}; // Store email & token

// Function to create a temporary email
async function createInbox() {
    try {
        const domainRes = await axios.get(`${BASE_URL}/domains`);
        const domain = domainRes.data["hydra:member"][0].domain; // Use first available domain

        const randomPrefix = Math.random().toString(36).substring(2, 8);
        const email = `${randomPrefix}@${domain}`;

        const response = await axios.post(`${BASE_URL}/accounts`, {
            address: email,
            password: "password123",
        });

        emailData = {
            address: email,
            id: response.data.id,
            token: null
        };

        console.log("Temporary Email:", email);
    } catch (error) {
        console.error("Error creating inbox:", error.response?.data || error.message);
    }
}

// Function to authenticate and get a token
async function authenticateInbox() {
    try {
        const response = await axios.post(`${BASE_URL}/token`, {
            address: emailData.address,
            password: "password123",
        });
        emailData.token = response.data.token;
        console.log("Access Token:", emailData.token);
    } catch (error) {
        console.error("Error authenticating:", error.response?.data || error.message);
    }
}

// API Route to get the created email
app.get("/get-email", (req, res) => {
    if (!emailData.address) return res.status(500).json({ error: "Email not yet created" });
    res.json({ email: emailData.address });
});

// API Route to fetch OTP from email
app.get("/fetch-otp", async (req, res) => {
    if (!emailData.token) return res.status(500).json({ error: "Email not authenticated" });

    try {
        const response = await axios.get(`${BASE_URL}/messages`, {
            headers: { Authorization: `Bearer ${emailData.token}` },
        });

        const messages = response.data["hydra:member"];
        if (!messages.length) return res.status(404).json({ error: "No emails found" });

        const latestEmail = await axios.get(`${BASE_URL}/messages/${messages[0].id}`, {
            headers: { Authorization: `Bearer ${emailData.token}` },
        });

        const otp = extractOtp(latestEmail.data.text);
        res.json({ otp });
    } catch (error) {
        console.error("Error fetching emails:", error);
        res.status(500).json({ error: "Failed to fetch emails" });
    }
});

// Function to extract OTP (6-digit number)
function extractOtp(body) {
    const otpPattern = /\b\d{6}\b/;
    const match = body.match(otpPattern);
    return match ? match[0] : null;
}

// Start Server & Create Inbox
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await createInbox();
    await authenticateInbox();
});
