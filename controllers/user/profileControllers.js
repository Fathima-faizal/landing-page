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




module.exports={
    getforgotpasspage,
    forgotEmailValid,
    verifyForgotPassOtp,
    getRestPasspage,
    getresndOtp,
    postNewPassword,
}