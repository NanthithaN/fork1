require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const cors = require('cors');

const app = express(); 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors()); 

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

mongoose.connect('mongodb://localhost:27017/photobooth', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB connected');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

const userSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    email: { type: String, unique: true },
    password: String,
    confirmPassword: String
});

const User = mongoose.model('User', userSchema);
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/signin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'signin.html')));
app.get('/cam', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cam.html')));
app.get('/collage', (req, res) => res.sendFile(path.join(__dirname, 'public', 'collage.html')))
app.post('/signin', async (req, res) => {
    const { firstname, lastname, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match');
    }

    try {
        const newUser = new User({ firstname, lastname, email, password, confirmPassword });
        await newUser.save();
        res.redirect('/login');
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).send('Email already exists');
        }
        res.status(500).send('Error occurred while saving user');
    }
});

app.post('/login', async (req, res) => {
    const { email, password, role } = req.body;

    try {
        if (role === 'admin') {
            if (email === 'jananibalamurugan2123@gmail.com' && password === 'admin') {
                req.session.admin = true;
                return res.redirect('/');
            } else {
                return res.status(401).send('Unauthorized');
            }
        } else {
            const user = await User.findOne({ email });
            if (!user || user.password !== password) {
                return res.status(400).send('Invalid email or password');
            }
            req.session.user = user;
            res.redirect('/');
        }
    } catch (err) {
        res.status(500).send('Error occurred during login');
    }
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, 
    },
});

app.post('/check-email', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user) {
        return res.status(200).send(); 
    } else {
        return res.status(404).send(); 
    }
});

app.post('/send-email', async (req, res) => {
    const { email, customText, imageData } = req.body;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Captured Photo',
        text: customText,
        attachments: [{
            filename: 'captured_image.png',
            content: imageData.split(',')[1], 
            encoding: 'base64'
        }],
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).send('Error sending email: ' + error.message + ' Code: ' + error.code);
        }
        console.log('Email sent:', info);
        res.status(200).send('Email sent successfully');
    });
});

const PORT = process.env.PORT || 3050;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});