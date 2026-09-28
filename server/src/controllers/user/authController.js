// controllers/authController.js
const User = require('../../models/user');
const OTP = require('../../models/otp')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const sendEmail = require('../../utils/sendEmail'); // adjust path if needed

// Helper: generate a JWT for a given user ID
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },           // payload — what's embedded inside the token
    process.env.JWT_SECRET,   // secret key used to sign it
    { expiresIn: '30d' }      // token validity
  );
};

// Helper: set the token as an httpOnly cookie on the response
const sendTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,                                  // JS can't read it — blocks XSS token theft
    secure: process.env.NODE_ENV === 'production',    // only over HTTPS in prod
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // 'lax' needed in dev if frontend/backend are on different ports
    maxAge: 30 * 24 * 60 * 60 * 1000                  // 30 days — match JWT expiry above
  });
};

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);





//signup
const signup = async(req,res)=>{
  try{

    const {username,email,password} = req.body;
    if(!username || !email || !password){
        return res.status(400).json({message:"Please fill all the fields"})
    }

    const usernameRegex = /^.{6,10}$/;
    if(!usernameRegex.test(username))
    {
      return res.status(400).json(
        {
          message : "Username should be 6 characters"
        }
      )
    }
  
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if (!emailRegex.test(email)) {
     return res.status(400).json({
       message: "Please enter a valid email"
       });
                                }
    
      
    const passwordRegex = /^.{6,15}$/
    if(!passwordRegex.test(password)){
            return res.status(400).json({
                message : "Password should be 6 characters"
            })
                                    }
                           

    const userExists = await User.findOne({email});
    if(userExists){

        if(userExists.isVerified)
             return res.status(400).json({message:"User already exists"})

      await User.deleteOne({email});

                  }

    const hashedPassword = await bcrypt.hash(password,10);

    const user = await User.create({
      username,
      email,
      password : hashedPassword
    })

   res.status(201).json({
    _id : user._id,
    username : user.username
   })
  }
  catch(err){
    console.log(err);
    res.status(500).json({
      message:"Error please send again"
    })
  }
}





const google = async(req,res)=>{
  try{

    const { token } = req.body; // ID token sent from frontend

    if (!token) {
      return res.status(400).json({ message: 'Google token is required' });
                }
    
    console.log('google token is :',token);

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log('Google payload is :',payload);
    const { sub: googleId, email, name, picture } = payload;
   
    let user = await User.findOne({ googleId });
    
    if (!user) {
    
      user = await User.findOne({ email });

      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        if (!user.profileImage) user.profileImage = picture;
        await user.save();
      } else {
        // 4. Brand new user
        user = await User.create({
          username: name,
          email,
          googleId,
          profileImage: picture,
          isVerified: true,
          termsAccepted: true,
        });
      }
    }

    // 5. Block check
    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked' });
    }
   
  const jwtToken = generateToken(user._id);
  sendTokenCookie(res,jwtToken);
    
    res.status(200).json(
       {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      }
    );
    
  }catch(err){
    console.log(err);
    return res.status(500).json({
      error : {data : "Internal server error", message : "What are you doing"}})
  }
}






//login
const login = async(req,res)=>{
try{
  const {email,password} = req.body;

  if(!email || !password){
    return res.status(400).json({
      message:"Please fill all fields"
    })
  }

  const user = await User.findOne({email});

  if(!user || !user.isVerified)
  {
    return res.status(400).json({
      message : "Not registered. Register first to login"
    })
  }

  if(user.isBlocked)
  {
    return res.status(401).json({
      message : "User is blocked"
    })
  }

  const isMatch = await bcrypt.compare(password,user.password);
  
  if(!isMatch){
    return res.status(401).json({message:"Invalid credentials"})
  }
   
  const token = generateToken(user._id);
  sendTokenCookie(res,token);

  res.status(200).json({

    id : user._id,
    username : user.username,
    email : user.email
  })
} 
   catch(error)
{
  console.log(error);
  res.status(400).json({
    message : "Login failed "
  })
}

}





const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,                                  // JS can't read it — blocks XSS token theft
    secure: process.env.NODE_ENV === 'production',    // only over HTTPS in prod
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // 'lax' needed in dev if frontend/backend are on different ports
  
  });
  res.status(200).json({ message: 'Logged out successfully' });
};





//otp
const sendOtp = async(req,res)=>{
try{

  const {email} = req.body;

  const user = await User.findOne({email});

  if(!user){
    return res.status(400).json({
      message:"User does not exist"
    })
  }

  await OTP.deleteMany({ userId: user._id, type: "signup" });

  const otp = Math.floor(Math.random()*900000)+100000;
   
  const otpDoc = await OTP.create({
    userId : user._id,
    otp,
    type:"signup"
  })

    try {
    await sendEmail({
      to: email,
      subject: "Your Signup OTP",
      html: `<p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`
    });
  } catch (mailErr) {
    console.log("Email send failed:", mailErr);
    await OTP.deleteOne({ _id: otpDoc._id });
    return res.status(500).json({ message: "Failed to send OTP, please try again" });
  }

  console.log(otp)
  res.status(200).json({
    message : "sent successfully",
    expiresAt : new Date(otpDoc.createdAt.getTime() + 5*60*1000)
  })

}catch(error)
{
  console.log(error);
  res.status(400).json({
    message : "send otp again"
  })
}
}





const verifyOtp = async(req,res)=>{

  try{
    const {email,otp} = req.body;
    
    const user = await User.findOne({email});

    if(!user){
      return res.status(400).json({
        message : "User does not exist"
      })
             }

    const otpExists = await OTP.findOne({userId:user._id,otp,type:"signup"});

    if(!otpExists){
      return res.status(400).json({
        message : "OTP wrong"
      })
    }

    const otpAge = Date.now() - otpExists.createdAt.getTime();

    if(otpAge > 5 * 60 * 1000){
      return res.status(400).json({
        message : "OTP expired"
      })
    }

    user.isVerified = true;
    await user.save();

    await OTP.deleteOne({_id :otpExists._id});

   const token = generateToken(user._id);
   sendTokenCookie(res,token);


    res.status(200).json({
        id : user._id,
        username : user.username,
        email : user.email
    })

  }catch(error){
    console.log(error);

    res.status(400).json({
      message : "Error request"
    })
  }
}





const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Please enter your email"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User does not exist"
      });
    }

    await OTP.deleteMany({
      userId: user._id,
      type: "reset"
    });

    const otp = Math.floor(Math.random() * 900000) + 100000;

    const otpDoc = await OTP.create({
      userId: user._id,
      otp,
      type: "reset"
    });

    try {
      await sendEmail({
        to: email,
        subject: "Your Password Reset OTP",
        html: `<p>Your password reset OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`
      });
    } catch (mailErr) {
      console.log("Email send failed:", mailErr);
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(500).json({
        message: "Failed to send OTP, please try again"
      });
    }

    res.status(200).json({
      message: "OTP sent successfully",
      expiresAt : new Date(otpDoc.createdAt.getTime() + 5*60*1000)
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Something went wrong"
    });
  }
};





const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Please enter email and OTP"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User does not exist"
      });
    }

    const otpExists = await OTP.findOne({
      userId: user._id,
      otp,
      type: "reset"
    });

    if (!otpExists) {
      return res.status(400).json({
        message: "Invalid OTP"
      });
    }

    const otpAge = Date.now() - otpExists.createdAt.getTime();

    if (otpAge > 5 * 60 * 1000) {
      return res.status(400).json({
        message: "OTP expired"
      });
    }

    await OTP.deleteOne({
      _id: otpExists._id
    });

const resetToken = jwt.sign(
  { id: user._id, purpose: "reset" },
  process.env.JWT_SECRET,
  { expiresIn: "10m" }
);

res.status(200).json({
  message: "OTP verified successfully",
  resetToken   
});

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Something went wrong"
    });
  }
};





const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        message: "Please provide reset token and new password"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        message: "Reset link expired or invalid, please try again"
      });
    }

    if (payload.purpose !== "reset") {
      return res.status(400).json({
        message: "Invalid reset token"
      });
    }

    const user = await User.findById(payload.id);

    if (!user) {
      return res.status(400).json({
        message: "User does not exist"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      message: "Password reset successful"
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Something went wrong"
    });
  }
};




const resendOtp = async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email || !type) {
      return res.status(400).json({ message: "Please provide email and OTP type" });
    }

    if (type !== "signup" && type !== "reset") {
      return res.status(400).json({ message: "Invalid OTP type" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    if (type === "signup" && user.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    await OTP.deleteMany({ userId: user._id, type });

    const otp = Math.floor(Math.random() * 900000) + 100000;

    const otpDoc = await OTP.create({ userId: user._id, otp, type });

    try {
      await sendEmail({
        to: email,
        subject: type === "signup" ? "Your Signup OTP" : "Your Password Reset OTP",
        html: `<p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`
      });
    } catch (mailErr) {
      console.log("Email send failed:", mailErr);
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(500).json({ message: "Failed to send OTP, please try again" });
    }

    res.status(200).json({
      message: "OTP resent successfully",
      expiresAt: new Date(otpDoc.createdAt.getTime() + 5 * 60 * 1000)
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};





module.exports = {
  login,
  signup,
  sendOtp,
  verifyOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  resendOtp,google,
  logout
};