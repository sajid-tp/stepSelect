const User = require('../../models/user');
const cloudinary = require('../../config/cloudinary');
const OTP = require('../../models/otp');
const sendEmail = require('../../utils/sendEmail');
const bcrypt = require('bcryptjs');




const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // from JWT, not from request params
    const user = await User.findById(userId).select('username email profileImage phoneNumber');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ data: user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};





const updateProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // 1. Convert Multer memory buffer to base64
    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // 2. Upload to Cloudinary
    const result = await cloudinary.uploader.upload(fileStr, {
      folder: 'stepSelect/profile_pictures',
    });

    // 3. Update the user in MongoDB using req.user.id from your authMiddleware
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: result.secure_url },
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: 'Profile image updated successfully',
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};





const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, phoneNumber } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }


    const trimmedName = username.trim();

    if (trimmedName.length < 6) {
      return res.status(400).json({ message: 'Name must be at least 6 characters long' });
    }

        if (!phoneNumber || !String(phoneNumber).trim()) {
      return res.status(400).json({ message: 'Phone number is required' });
    }


    const trimmedPhone = String(phoneNumber).trim();

    // Must be digits only, at least 10 digits (allows up to 15 for international numbers)
    const phoneRegex = /^\d{10,15}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      return res.status(400).json({ message: 'Phone number must contain only digits and be at least 10 digits long' });
    }


    const user = await User.findByIdAndUpdate(
      userId,
      { username: username.trim(), phoneNumber: String(phoneNumber).trim() },
      { new: true, runValidators: true }
    ).select('username profileImage email phoneNumber');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ data: user });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};





// Request OTP for Email Change (Protected — User must be logged in)
const changeEmail = async (req, res) => {
  try {
    const { newEmail } = req.body;
    console.log('The new email is ',newEmail);
    if (!newEmail) {
      return res.status(400).json({ message: "Please provide the new email" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }

    const formattedEmail = newEmail.trim().toLowerCase();

    // 1. Prevent changing to current email
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (currentUser.email.toLowerCase() === formattedEmail) {
      return res.status(400).json({ message: "New email cannot be the same as current email" });
    }

    // 2. Check if another verified user already uses this email
    const existingUser = await User.findOne({ email: formattedEmail });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: "Email is already in use by another account" });
    }

    // 3. Delete any pending change_email OTPs for this user
    await OTP.deleteMany({ userId: currentUser._id, type: "change_email" });

    // 4. Generate 6-digit OTP
    const otp = Math.floor(Math.random() * 900000) + 100000;

    // 5. Store OTP with newEmail (or attach tempEmail to User)
    const otpDoc = await OTP.create({
      userId: currentUser._id,
      otp,
      type: "change_email",
      newEmail: formattedEmail, // Make sure your OTP schema allows newEmail (String)
    });

    // 6. Send OTP to the NEW email address to verify ownership
    try {
      await sendEmail({
        to: formattedEmail,
        subject: "Verify Your New Email Address",
        html: `<p>Your email change verification code is <b>${otp}</b>. It expires in 5 minutes.</p>`,
      });
    } catch (mailErr) {
      console.log("Email send failed:", mailErr);
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(500).json({ message: "Failed to send verification email, please try again" });
    }

    res.status(200).json({
      message: "Verification OTP sent to your new email",
      expiresAt: new Date(otpDoc.createdAt.getTime() + 5 * 60 * 1000),
    });
  } 
  catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};




// Verify OTP and Commit Email Change
const verifyChangeEmailOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "Please enter the OTP" });
    }

    const otpDoc = await OTP.findOne({
      userId: req.user.id,
      otp,
      type: "change_email",
    });

    if (!otpDoc) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const otpAge = Date.now() - otpDoc.createdAt.getTime();
    if (otpAge > 5 * 60 * 1000) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Commit new email to User
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { email: otpDoc.newEmail },
      { new: true}
    ).select("-password");

    // Clean up OTP record
    await OTP.deleteOne({ _id: otpDoc._id });

    res.status(200).json({
      message: "Email updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error updating email" });
  }
};

//change password (for logged-in user)
const changePassword = async (req, res) => {
  try {

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Please fill all the fields"
      })
    }

    const passwordRegex = /^.{6,15}$/
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: "Password should be 6 characters"
      })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirm password do not match"
      })
    }

    // req.user comes from your auth middleware (the same way protected routes get the logged-in user)
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(400).json({
        message: "User does not exist"
      })
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Current password is incorrect"
      })
    }

    const isSame = await bcrypt.compare(newPassword, user.password);

    if (isSame) {
      return res.status(400).json({
        message: "New password must be different from current password"
      })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      message: "Password changed successfully"
    })

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error please send again"
    })
  }
}



module.exports = {
  getProfile, updateProfileImage, changeEmail, verifyChangeEmailOtp, updateProfile, changePassword
};