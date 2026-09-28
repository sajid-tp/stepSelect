const jwt = require('jsonwebtoken');

// Helper: generate a JWT for a given user ID
const generateToken = () => {
  return jwt.sign(
    { isAdmin : true },           // payload — what's embedded inside the token
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


//login
const adminLogin = (req, res) => {
try{

  const { email, password } = req.body;
   
  if(!email || !password){
    return res.status(400).json({
        message : "Email and password are required"
    })
  }

  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Invalid admin credentials" });
                                                                                    }

  const token = generateToken();
  sendTokenCookie(res,token);

  res.status(200).json({
    message : "login successful"
  })

}catch(error){

    console.log(error)
    res.status(400).json({
        message : "Bad request"
    })
}
 
};





module.exports = {adminLogin}