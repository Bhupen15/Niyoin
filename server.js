// server.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const otpGenerator = require('otp-generator');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

// MongoDB setup
mongoose.connect('mongodb+srv://bhupendrachoudhary1746:a0MgYoRSk5DBCrvb@bhupen.2zps75c.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true });
const User = mongoose.model('User', {
    username: String,
    password: String,
    phone: String,
    otp: String
});

// Middleware for OTP authentication
const authenticateOTP = async (req, res, next) => {
    try {
        const { phone, otp } = req.body;
        const user = await User.findOne({ phone });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.otp !== otp) {
            return res.status(401).json({ message: "Invalid OTP." });
        }

        // OTP verified successfully
        req.user = user; // Attach user object to request for further use
        next(); // Move to the next middleware or route handler
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error authenticating OTP." });
    }
};

// Signup endpoint
app.post('/signup', async (req, res) => {
    try {
        const { username, password, phone } = req.body;
        const existingUser = await User.findOne({ phone });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });

        const newUser = new User({ username, password: hashedPassword, phone, otp });
        await newUser.save();
        res.status(201).json({ message: "User created successfully. Verify your phone number with OTP." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error creating user." });
    }
});

// Login endpoint
app.post('/login', authenticateOTP, async (req, res) => {
    try {
        res.json({ message: "Login successful!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error logging in." });
    }
});

// Send OTP endpoint
app.post('/sendotp', async (req, res) => {
    try {
        const { phone } = req.body;
        const existingUser = await User.findOne({ phone });

        if (!existingUser) {
            return res.status(404).json({ message: "User not found." });
        }

        const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
        existingUser.otp = otp;
        await existingUser.save();

        // For demo purposes, log the OTP to console instead of sending via SMS
        console.log(`Generated OTP for ${phone}: ${otp}`);

        res.json({ message: "OTP sent successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error sending OTP." });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));