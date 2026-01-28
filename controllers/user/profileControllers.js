const User=require('../../models/userSchema');
const nodemailer=require('nodemailer');
const bcrypt=require('bcrypt');
const env=require('dotenv').config();
const session=require('express-session');


function generateOtp(){
    const digits='1234567890';
    let otp='';
    for(let i=0;i<4;i++){
        otp+=digits[Math.floor(Math.random()*10)]
    }
    return otp
}

 const  sendVerificationEmail = async(email,otp)=>{
   try{
   const transporter=nodemailer.createTransport({
     service:'gmail',
     port:587,
     secure:false,
     require:true,
     auth:{
        user:process.env.NODEMAILER_EMAIL,
        pass:process.env.NODEMAILER_PASSWORD,
     }
   })

    const mailOptions={
        form:process.env.NODEMAILER_EMAIL,
        to:email,
        subject:'YOUR OTP for password reset',
        text:`Your otp is ${otp}`,
         html:`<b><h4>Your OTP: ${otp}</h4></b>`
    }
    const info= await transporter.sendMail(mailOptions);
    console.log('Email sent:',info.messageId);
    return true;

   }catch(error){
     console.log('Error sending email',error);
     return false;
   }

 }
  const securePassword=async(password)=>{
       try {
        const passwordHash=await bcrypt.hash(password,10);
        return passwordHash;
       } catch (error) {
        
       }
   }

const getforgotpasspage=async(req,res)=>{
    try{
      res.render('forgot-password')
    }catch(error){
      console.log('error',error);
      res.status(500).send('Internal server error')
    }
}
const forgotEmailValid=async(req,res)=>{
    try{
     const {email}=req.body;
      const findUser=await User.findOne({email:email});
      if(findUser){
        const otp=generateOtp();
        const emailSent=await sendVerificationEmail(email,otp);
        if(emailSent){
            req.session.userOtp=otp;
            req.session.email=email;
            res.render('forgotPass');
            console.log('OTP',otp)
        }else{
            res.json({success:false,message:'Failed to send OTP.please try again'})
        }

      }else{
        res.render('forgot-password',{
            message:'User with this email does not exit'
        });

      }
    }catch(error){
      console.log('error',error)
    }
}

const verifyForgotPassOtp=async(req,res)=>{
    try {
         const enterdOTP=req.body.otp;
         if(enterdOTP===req.session.userOtp){
            res.json({success:true,redirectUrl:'/resend-password'});
         }else{
            res.json({success:false,message:'OTP matching'});
         }

    } catch (error) {
        res.status(500).json({succses:false,message:'An error occured. Please try again'})
    }
}
const getRestPasspage=async(req,res)=>{
      try {
         res.render('reset-password')
      } catch (error) {
         res.status(500).send('Internale server error')
      }
}
const getresndOtp=async(req,res)=>{
   try {
     const otp=generateOtp();
     req.session.userOtp=otp;
     const email=req.session.email;
     console.log('Resend otp to email:',email);
     const emailSent=await sendVerificationEmail(email,otp);
     if(emailSent){
      console.log('Resend otp:',otp);
      res.status(200).json({success:true,message:`Resend otp message successful`});
     }
   } catch (error) {
     console.log('Error in Resend otp',error)
     res.status(500).json({success:false,message:'Internal server error'});
    
   }
}
const postNewPassword=async(req,res)=>{
    try {
       const {newPass1,newPass2}=req.body;
       const email=req.session.email;
       if(newPass1===newPass2){
        const passwordHash=await securePassword(newPass1);
        await User.updateOne(
          {email:email},
          {$set:{password:passwordHash}}
        )
        res.redirect('login')

       }else{
        res.render('reset-password',{message:'Passwords do not match'})
       }
    } catch (error) {
      console.log('error',error);
      res.status(500).send('Interval server error')
    }
}
 const userProfile=async(req,res)=>{
 try {
   const userId=req.session.user;
   const userData=await User.findById(userId);
   res.render('profile',{
    user:userData,
   })
 } catch (error) {
     console.error('Error for retrieve Profile data',error);
     res.status(500).send('Internal server error')
 }
 }

 const logout=async(req,res)=>{
  try {
     req.session.destroy((error)=>{
      if(error){
        console.log('session destruction error',error.message);
        return res.status(400).send('Client error')
      }
      return res.redirect('/login')
     });

  } catch (error) {
   console.log(error);
   res.status(500).send('Internal server error')
    
  }

 }
  const changeEmail=async(req,res)=>{
  try {
     res.render('change-email')
  } catch (error) {
    res.status(500).send('Internal server error')
  }

  }
 const changeEmailValid=async(req,res)=>{
  try {
    const {email}=req.body;
     const userExists=await User.findOne({email});
     if(userExists){
       const otp=generateOtp();
       const emailSent=await sendVerificationEmail(email,otp);
       if(emailSent){
        req.session.userOtp=otp;
        req.session.userData=req.body;
        req.session.email=email;
        res.render('change-email-otp');
        console.log('Email',email);
        console.log('Email sent OTP',otp)
       }else{
        res.json(`email-error`);
       }

     }else{
       res.render('change-email',{message:'User with email not exist'})
     }
  } catch (error) {
    res.status(500).send('Internal server error')
  }
 }
 const verifyEmailotp=async(req,res)=>{
    try {
      const Enterotp=req.body.otp;
      if(Enterotp===req.session.userOtp){
        req.session.userData=req.body.userData;
        return res.json({success:true,redirectUrl:'/new-email'})
      }else{
        res.render('change-email-otp',{
        message:'OTP not matching',
        userData:req.session.userData
        })
      }
    } catch (error) {
       res.status(500).send('Internal server error')
    }
 }
 const newEmail=async(req,res)=>{
   try {
       res.render('new-email')
   } catch (error) {
      res.status(500).send('Internal server error')
   }
 }
  const updateEmail=async(req,res)=>{
    try {
       const newEmail=req.body.newEmail;
       const userId=req.session.user;
       await User.findByIdAndUpdate(userId,{email:newEmail});
       res.redirect('/profile')

    } catch (error) {
       res.status(500).send('Internal server error')
    }
  };
const resetEmail=async(req,res)=>{
    try{
     const {email}=req.session.userData;
     if(!email){
        return res.status(400).json({success:false,message:'email not found session'})
     }
     const otp=generateOtp();
     req.session.userOtp=otp;
     const emailSent=await sendVerificationEmail(email,otp);
     if(emailSent){
        console.log('Resend  OTP',otp);
        res.status(200).json({success:true,message:'OTP resend successfully'})
     }else{
        res.status(500).json({success:false,message:'Failed resend OTP,please try again'})
     }
   }catch(error){
     console.error('Error resending OTP',error);
     res.status(500).json({success:false,message:'Internal server error, please try again'})
   }
}
const changePassword=async(req,res)=>{
  try {
     res.render('change-password')
  } catch (error) {
     res.status(500).send('Internal server error')
  }
}
const changePasswordValid=async(req,res)=>{
  try {
    const {email}=req.body;
     const userExists=await User.findOne({email});
     if(userExists){
      const otp=generateOtp();
      const emailSent=await sendVerificationEmail(email,otp);
      if(emailSent){
        req.session.userOtp=otp;
        req.session.userData=req.body;
        req.session.email=email;
        res.render('change-password-otp');
        console.log('Change password OTP',otp)
      }else{
        res.json({succes:false,message:`Failed to send OTP, please try again`})
      }
     }else{
      res.render('change-password',{message:`USer with this email does not Exist`})
     }
  } catch (error) {
    console.log('Error in change Password Validation',error);
    res.status(500).send('Internal server error')
  }
}
 const verifyChangePasswordOtp=async(req,res)=>{
  try {
     const Enterotp=req.body.otp;
    if(Enterotp===req.session.userOtp){
      req.session.userData=req.body.userData;
      return res.json({success:true,redirectUrl:'/resend-password'})

    }else{
      res.render('change-password-otp',{
        message:'OTP not matching',
        userData:req.session.userData
      })
    }
  } catch (error) {
     res.status(500).send('Internal server error')
  }
 }
 

module.exports={
    getforgotpasspage,
    forgotEmailValid,
    verifyForgotPassOtp,
    getRestPasspage,
    getresndOtp,
    postNewPassword,
    userProfile,
    logout,
    changeEmail,
    changeEmailValid,
    verifyEmailotp,
    newEmail,
    updateEmail,
    resetEmail,
    changePassword,
    changePasswordValid,
    verifyChangePasswordOtp,
}