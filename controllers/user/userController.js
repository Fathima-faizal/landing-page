const User=require('../../models/userSchema');
const env=require('dotenv').config
const nodemailer=require('nodemailer');
const bcrypt=require('bcrypt');
// const user = require('../../models/userSchema');


const loadLandingpage=async(req,res)=>{
    try{
      return res.render('landing')
    }catch(error){
        console.log('landing page not found')
        res.status(500).send('server error')
    }
}
const loginPage=async(req,res)=>{
    try{
      if(!req.session.user){
        return res.render('login')
      }else{
        res.redirect('home')
      }
     
    }catch(error){
        console.log('login page not found');
        res.status(500).send('server error')
    }
}
const signupPage=async(req,res)=>{
    try{
    return res.render('signup');
    }catch(error){
        console.log('signup pag not found');
        res.status(500).send('server error')
    }
}

function generateOtp(){
    return Math.floor(1000+Math.random()*9000).toString(); 
}
async function sendVerificationEmail(email,otp){
    try{
      const transporter=nodemailer.createTransport({
        service:'gmail',
        port:587,
        secure:false,
        requireTLS:true,
        auth:{
            user:process.env.NODEMAILER_EMAIL,
            pass:process.env.NODEMAILER_PASSWORD,
        }
      })
      const info=await transporter.sendMail({
        from:process.env.NODEMAILER_EMAIL,
        to:email,
        subject:'Verify your Account',
        text:`Your OTP is ${otp}`,
        html:`<b>Your OTP:${otp}</b>`,
      })
      return info.accepted.length>0
    }catch(error){
        console.error('Error Sending Email',error);
        return false
    }
}
const signup=async(req,res)=>{
    try{
      const {name,email,password,ConformPassword}=req.body;
      const findUser=await User.findOne({email});
      if(findUser){
        return res.render('signup',{message:'User with this email alreday exists'})
      }
      if(password!=ConformPassword){
        return res.render('signup',{message:'Password do not matching'})
      }
      const otp=generateOtp();
      const emailSent=await sendVerificationEmail(email,otp);
      if(!emailSent){
        return res.json('Email error')
      }
      req.session.userOtp=otp;
      req.session.userData={name,email,password,ConformPassword};

      res.render('verify_otp');
      console.log('OTP sent',otp)
    }catch(error){
      console.error('signup error',error);
      res.redirect('login')
    }
}
const securePassword=async(password)=>{
    try{
   const passwordHash=await bcrypt.hash(password,10)
   return passwordHash;
    }catch(error){

    }
}
const verifyOtp=async(req,res)=>{
  try{
    const {otp}=req.body;
    console.log(otp);
    if(otp===req.session.userOtp){
        const user=req.session.userData;
        const passwordHash=await securePassword(user.password);
        const saveUserdata=new User({
            name:user.name,
            email:user.email,
            password:passwordHash,
        })
        await saveUserdata.save();
        req.session.user=saveUserdata._id;
        res.json({ success: true, redirectUrl: '/login' });
    }else{
        res.status(400).json({success:false,message:'Invalid OTP,please try again'})
    }
  }catch(error){
     console.error('Error verify OTP',error)
     res.status(500).json({success:false,message:'An error occured'})
  }
 };
const resendOtp=async(req,res)=>{
   try{
     const {email}=req.session.userData;
     if(!email){
        return res.status(400).json({success:false,message:'email not found session'})
     }
     const otp=generateOtp();
     req.session.userOtp=otp;
     const emailSent=await sendVerificationEmail(email,otp);
     if(emailSent){
        console.log('Resend OTP',otp);
        res.status(200).json({success:true,message:'OTP resend successfully'})
     }else{
        res.status(500).json({success:false,message:'Failed resend OTP,please try again'})
     }
   }catch(error){
     console.error('Error resending OTP',error);
     res.status(500).json({success:false,message:'Internal server error, please try again'})
   }
}
const homepage=async(req,res)=>{
  try{
   return res.render('home')
  }catch(error){
     console.log('home page not found')
        res.status(500).send('server error')
  }
}
  const login = async (req,res)=>{
  try{
    console.log("BODY:", req.body);

    const {email,password}=req.body;
    const findUser=await User.findOne({isAdmin:false,email:email});

    if(!findUser){
      return res.render('login',{message:'User not found'})
    }
    if (findUser.isBlocked) {
                return res.render("login", { message: "Your account has been blocked." });
            }

    const passwordMatch = await bcrypt.compare(password, findUser.password);

    if(!passwordMatch){
      return res.render('login',{message:'Incorrect Password'})
    }

    req.session.user = findUser._id;
    return res.redirect('home');

  }catch(error){
    console.log('login error',error);
    res.render('login',{message:'login failed'});
  }
}

module.exports={
    loadLandingpage,
    loginPage,
    signupPage,
    signup,
    verifyOtp,
    resendOtp,
    homepage,
    login,
}