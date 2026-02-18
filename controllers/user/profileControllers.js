const User=require('../../models/userSchema');
const Address=require('../../models/addressSchema')
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
            res.json({success:true,redirectUrl:'/resendPassword'});
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
        res.render('resetPassword',{message:'Passwords do not match'})
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
   const addressData=await Address.findOne({userId:userId});
   res.render('profile',{
    user:userData,
    userAddress:addressData,
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
        return res.json({success:true,redirectUrl:'/newEmail'})
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
       res.render('newEmail')
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
     res.render('changePassword')
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
      return res.json({success:true,redirectUrl:'/resendPassword'})

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
 const address=async(req,res)=>{
  try {
    const userId=req.session.user;
    const page = parseInt(req.query.page) || 1;
    const limit = 2;
    const skip = (page - 1) * limit;
    const userAddress = await Address.findOne({ userId: userId }); 
    if (!userAddress) {
      return res.render('address', {
        userAddress: { address: [] },
        currentPage: page,
        totalPages: 0
      });
    }
    const totalAddresses = userAddress.address.length;
    const totalPages = Math.ceil(totalAddresses / limit);
    const paginatedAddresses =userAddress.address.slice(skip, skip + limit);
     res.render('address',{ 
      userAddress: { address: paginatedAddresses },
      currentPage: page,
       totalPages: totalPages
     })
  } catch (error) {
    console.log('error',error);
    res.status(500).send('Inernal server error')
  }
 }

 const addAddress=async(req,res)=>{
   try {
     const user=req.session.user;
     res.render('addAddress',{user:user})           
   } catch (error) {
    res.status(500).send('Internal server error')
   }
 }
 const postaddAddress=async(req,res)=>{
  try {
    const userId=req.session.user;
    const userData=await User.findOne({_id:userId})
    const {addressType,houseName,street,landmark,city,zipCode,country,phoneNumber}=req.body;
     if(!addressType || !houseName || !street || !landmark || !city || !zipCode || !country||!phoneNumber){
      return res.redirect('/addAddress');
    }
    const userAddress=await Address.findOne({userId:userData._id});
    if(!userAddress){
      const newAddress=new Address({
        userId:userData._id,
        address:[{addressType,houseName,street,landmark,city,zipCode,country,phoneNumber}]
      })
      await newAddress.save()
    }else{
      userAddress.address.push({addressType,houseName,street,landmark,city,zipCode,country,phoneNumber})
      await userAddress.save()
    }
    res.redirect('address')
  } catch (error) {
    console.log('Address error',error);
    res.status(500).send('Internal server error')
  }
 }
  const editAddress=async(req,res)=>{
   try {
     const addressId=req.query.id;
     const user=req.session.user;
     const currentAddress=await Address.findOne({
      'address._id':addressId,
     })
     if(!currentAddress){
      return res.status(400).send('Client error')
     }
     const addressData=currentAddress.address.find((item)=>{
      return item._id.toString()===addressId.toString();
     })
     if(!addressData){
      return res.status(400).send('Client error');
     }
     res.render('editAddress',{address:addressData,user:user})
   } catch (error) {
     console.log('error',error);
     res.status(500).send('Internal server error')
   }
  }
  const postEditAddress=async(req,res)=>{
     try {
        const data=req.body;
        const addressId=req.body.addressId;
        const  user=req.session.user;
        const findAddress=await Address.findOne({'address._id':addressId})
        if(!findAddress){
         return  res.status(400).send('Client error')
        }
        await Address.updateOne(
          {'address._id':addressId},
          {$set:{
            "address.$":{
             _id: addressId,
             address:data.addressType,
             houseName:data.houseName,
             street:data.street,
             landmark:data.landmark,
             city:data.city,
             zipCode:data.zipCode,
             country:data.country,
             phoneNumber:data.phoneNumber
            }
          }}
        );
        res.redirect('address')
     } catch (error) {
      console.log('edit Address',error)
      res.status(500).send('Internal server error')
     }
  }
  const deleteAddress=async(req,res)=>{
    try {
      const addressId=req.query.id;
      const findAddress=await Address.findOne({'address._id':addressId});
      if(!findAddress){
        return res.status(400).send('Address not found')
      }
      await Address.updateOne({
        "address._id":addressId
      },{
        $pull:{
          address:{
            _id:addressId
          }
        }
      })
      res.redirect('address')
    } catch (error) {
      console.log('Error in delete address',error);
      res.status(500).send('Internal server error')
    }
  }
 const defaultAddress=async(req,res)=>{
  try {
    let id=req.query.id;
    const userId = req.session.user;
    await Address.updateOne(
      {userId:userId},
      {$set:{"address.$[].isDefault":false}}
    )
    await Address.updateOne(
      {userId:userId},
      {$set:{"address.0.isDefault":true}}
    )
    res.redirect('address')
  } catch (error) {
    console.log('error',error);
    res.status(500).send('Internal server error')
  }
 }
 const getwallet=async(req,res)=>{
  try {
    const userId=req.session.user;
    const page = parseInt(req.query.page) || 1;
        const limit = 3; 
        const skip = (page - 1) * limit;
    const user=await User.findById(userId);
    const allTransactions = user.history.reverse();
    const paginatedTransactions = allTransactions.slice(skip, skip + limit);
    const totalTransactions = allTransactions.length;
        const totalPages = Math.ceil(totalTransactions / limit);
    const balance = user.wallet ? Number(user.wallet) : 0;
    res.render('wallet',{
      user,
      walletBalance: user.wallet || 0,
      transactions: paginatedTransactions, 
      currentPage: page,
      totalPages: totalPages
    })
  } catch (error) {
    console.log('error',error);
    res.status(500).send('Internal server error')
  }
 }
 const addmoney=async(req,res)=>{
  try {
    const userId=req.session.user;
    const {amount}=req.body;
    const addAmount=Number(amount)
    if(!addAmount||addAmount<=0){
      return res.json({status:false,message:`Invalid Amount`})
    }
    const user=await User.findById(userId);
    user.wallet = user.wallet + addAmount;
    user.history.push({
      description:'Money added to Wallet',
      amount:addAmount,
      type:'credit',
      status:'Completed',
      date:new Date()
    })
    await user.save();
    res.json({status:true,message:user.wallet})
  } catch (error) {
    console.log('error',error);
    res.status(500).send('Intenal server error')
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
    address,
    addAddress,
    postaddAddress,
    editAddress,
    postEditAddress,
    deleteAddress,
    defaultAddress,
    getwallet,
    addmoney,
}