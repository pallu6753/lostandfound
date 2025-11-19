const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const { name, email, password, studentId } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { studentId }] 
        });

        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists with this email or student ID' 
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            studentId
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully!',
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    studentId: user.studentId
                }
            }
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error during registration: ' + error.message 
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists and password matches
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                success: true,
                message: 'Login successful!',
                data: {
                    token: generateToken(user._id),
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        studentId: user.studentId
                    }
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error during login: ' + error.message
        });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        
        res.json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                studentId: user.studentId
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user: ' + error.message
        });
    }
};