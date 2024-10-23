import { sendEMail } from "../middleware/sendMail.js"
import User from "../models/userModel.js"
import { Response } from "../utils/response.js"
import { message } from "../utils/message.js"
// import { Responses } from "../utils/config.js"

export const registerUser = async (req, res) => {
    try {
        // Parsing body data
        const { firstName, middleName, lastName, email, password, dob, mobile, bio, username, gender } = req.body

        // Checking the body data
        if(!firstName || !lastName || !email || !password || !dob || !mobile || !username || !gender) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            })
        }

        // If user exists
        let user = await User.findOne({ email })
        if(user) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            })
        }

        user = await User.findOne({ username })
        if(user) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            })
        }

        // Create user

        user = await User.create({...req.body});

        const otp = Math.floor(100000 + Math.random() * 90000);
        const otpExpire = new Date(Date.now() + 15 * 60 * 1000);

        user.otp = otp;
        user.otpExpire = otpExpire;
        await user.save();

        // Email generation
        const subject = "Verify your account";
        const message = `Your OTP is ${otp}`;
        await sendEMail({email, subject, message});

        // Send response
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: user
        })
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
        // Responses(res, 500, false, error.message);
    }
}

export const verifyUser = async (req, res) => {
    try {
        // params and body
        const { id } = req.params;
        let { otp } = req.body;

        // Check id
        if(!id) {
            return Response(res, 400, false, message.idNotFoundMessage);
        }

        // Find user
        let user = await User.findById(id);
        if(!user) {
            return Response(res, 404, false, message.userNotFoundMessage);
        }

        // Check if user is already verified
        if(user.verified) {
            user.otp = undefined;
            user.otpExpire = undefined;
            user.otpAttempts = 0;
            user.otpAttemptsExpire = undefined;
            await user.save();

            return Response(res, 400, false, message.userAlreadyVerifiedMessage);
        }

        // Check if otpAttemptsExpire
        if(user.otpAttemptsExpire > Date.now()) {
            user.otp = undefined;
            user.otpExpire = undefined;
            user.otpAttempts = 0;
            await user.save();

            return Response(res, 400, false, `Try again after ${Math.floor((user.otpAttemptsExpire - Date.now()) % (60* 1000))} minutes and ${(user.otpAttemptsExpire - Date.now()) % 60} seconds`);
        }

        // Check if otp attempts
        if(user.otpAttempts >= 3) {
            user.otp = undefined;
            user.otpExpire = undefined;
            user.otpAttempts = 0;
            user.otpAttemptsExpire = new Date(Date.now() + process.env.OTP_ATTEMPTS_EXPIRE * 60 * 1000);
            await user.save();

            return Response(res, 400, false, message.otpAttemptsExceededMessage);
        }

        // Check if otp exists
        if(!otp) {
            user.otpAttempts += 1;
            await user.save();

            return Response(res, 400, false, message.otpNotFoundMessage);
        }

        // Check if otp is expired
        if(user.otpExpire < Date.now()) {
            user.otp = undefined;
            user.otpAttempts = 0;
            user.otpAttemptsExpire = undefined;
            await user.save();
            
            return Response(res, 400, false, message.otpExpiredMessage);
        }

        // If otp matches
        otp = Number(otp);
        if(user.otp !== otp) {
            user.otpAttempts += 1;
            await user.save();

            return Response(res, 401, false, message.invalidOtpMessage)
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpire = undefined;
        user.otpAttempts = 0;
        user.otpAttemptsExpire = undefined;
        await user.save();

        // Authenticate user
        const token = user.generateToken();

        const options = {
            expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
            httpOnly: true,
            sameSite: 'none',
            secure: true
        }

        res.status(200).cookie('token', token, options).json({
            success: true,
            message: message.userVerifiedMessage,
            data: user
        });
        

    } catch (error) {
        Response(res, 500, false, error.message);
    }
}

export const resendOtp = async (req, res) => {
    try {
        // params and body
        const { id } = req.params;

        // Check id
        if(!id) {
            return Response(res, 400, false, message.idNotFoundMessage);
        }

        // Find user & check user
        let user = await User.findById(id);
        if(!user) {
            return Response(res, 404, false, message.userNotFoundMessage);
        }

        // Check if user is already verified
        if(user.verified) {
            user.otp = undefined;
            user.otpExpire = undefined;
            user.otpAttempts = 0;
            user.otpAttemptsExpire = undefined;
            await user.save();

            return Response(res, 400, false, message.userAlreadyVerifiedMessage);
        }

        // Generate new otp
        console.log(process.env.OTP_EXPIRE)
        const otp = Math.floor(100000 + Math.random() * 900000);
        const otpExpire = new Date(Date.now() + process.env.OTP_EXPIRE * 60 * 1000);
        
        // Save otp
        user.otp = otp;
        user.otpExpire = otpExpire;
        user.otpAttempts = 0;
        user.otpAttemptsExpire = undefined;
        await user.save();

        // Send otp
        const subject = "Verify your account";
        const body = `Your OTP is ${otp}`;
        await sendEMail({
            email: user.email, 
            subject, 
            message: body
        });

        // Send response
        // console.log(message.otpSendMessage);
        Response(res, 200, true, message.otpSendMessage);
        
    } catch (error) {
        Response(res, 500, false, error.message);
    }
}