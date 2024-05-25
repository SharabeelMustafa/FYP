const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const multer = require('multer');
const { con, upload } = require('E:/Comsate wha/s7/FYP/backend/app');




// Signup route


router.post('/signup_stu_by_admin', upload.single('profileImage'), async (req, res) => {
    const { name, email, password } = req.body;
    const profileImage = req.file.filename;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert student data into the database
    const sql = 'INSERT INTO students (name, email, password, profile_image) VALUES (?, ?, ?, ?)';
    const values = [name, email, hashedPassword, profileImage];

    con.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting data into the database:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.send('Student signed up successfully');
    });
});

module.exports = router;
