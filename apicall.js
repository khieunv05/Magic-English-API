const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { type } = require('express/lib/response');
const app = express();
app.use(express.json());
app.use(cors());

const mongoURL = process.env.MONGO_URL;
mongoose.connect(mongoURL)
        .then(() => console.log('Connected to MongoDB'))
        .catch(err => console.error('Could not connect to MongoDB...', err));
const paragraphSchema = new mongoose.Schema({
        content: String,
        point: Number,
        mistakes: [String],
        suggest: String,
        userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                index: true
        }
});
const Paragraph = mongoose.model('Paragraph', paragraphSchema);
const userSchema = new mongoose.Schema({
        username: String,
        password: String,
        name: String,
        email: String,
        birth_date: {
                type: Date,
                default: Date.now
        },
        phone_number: String,
        gender: String,
})
const User = mongoose.model('User', userSchema);
app.post('/api/register', async (req, res) => {
        try {
                const { username, password } = req.body;
                const existingUser = await User.findOne({ username: username });
                if (existingUser) {
                        return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
                }
                const salt = await bcrypt.genSalt(10);
                let hashedPassword = await bcrypt.hash(password, salt);
                const user = new User({
                        username: req.body.username,
                        password: hashedPassword,
                        name: req.body.name,
                        email: req.body.email,
                        birth_date: req.body.birth_date,
                        phone_number: req.body.phone_number,
                        gender: req.body.gender
                });
                const savedUser = await user.save();
                res.status(201).json({
                        data: savedUser,
                        message: 'Đăng ký thành công'
                });
        }
        catch (err) {
                res.status(500).json({ error: 'Server gặp lỗi' });
        }

});
app.post('/api/login', async (req, res) => {
        try {
                const { username, password } = req.body;
                const existingUser = await User.findOne({ username: username });
                if (!existingUser) {
                        return res.status(404).json({ error: 'Tên đăng nhập không tồn tại' });
                }
                const isPasswordValid = await bcrypt.compare(password, existingUser.password);
                if (!isPasswordValid) {
                        return res.status(401).json({ error: 'Mật khẩu không đúng' });
                }
                res.status(200).json({
                        data: existingUser,
                        message: 'Đăng nhập thành công'
                });
        }
        catch (err) {
                res.status(500).json({ error: 'Server gặp lỗi' });
        }
});
app.post('/api/submit-paragraph', async (req, res) => {
        try {
                const paragraph = new Paragraph({
                        content: req.body.content,
                        point: req.body.point,
                        mistakes: req.body.mistakes,
                        suggest: req.body.suggest,
                        userId: req.body.userId
                });
                const savedParagraph = await paragraph.save();
                return res.status(201).json({
                        data: savedParagraph,
                        message: 'Nộp đoạn văn thành công'
                });
        }
        catch (err) {
                res.status(500).json({ error: 'Server gặp lỗi' });
        }
});
app.get('/api/paragraphs/:userId', async (req, res) => {
        const userId = req.params.userId;
        try {
                const paragraphs = await Paragraph.find({ userId: userId });
                res.status(200).json({
                        data: paragraphs,
                        message: 'Lấy đoạn văn thành công'
                });
        }
        catch (err) {
                res.status(500).json({ error: 'Server gặp lỗi' });
        }
});
app.delete('/api/paragraph/:id', async (req, res) => {
        const paragraphId = req.params.id;
        try {
                await Paragraph.findByIdAndDelete(paragraphId);
                res.status(200).json({
                        message: 'Xoá đoạn văn thành công'
                });
        }
        catch (err) {
                res.status(500).json({ error: 'Server gặp lỗi' });
        }
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
});