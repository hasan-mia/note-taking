const express = require('express');
const router = express.Router();
const uploadRouter = require('./uploadRoutes')
const authRouter = require('./authRoutes')
const userRouter = require('./userRoutes')
const noteRouter = require('./noteRoutes')
const postRouter = require('./postRoutes')


// Upload route
router.use('/upload', uploadRouter);

// API routes
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/notes', noteRouter);
router.use('/posts', postRouter);

module.exports = router;