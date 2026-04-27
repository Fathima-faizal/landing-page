const User=require('../../models/userSchema');
const Category=require('../../models/categorySchema');
const Product=require('../../models/productSchema');
const Brand=require('../../models/brandSchema')
const env=require('dotenv').config
const nodemailer=require('nodemailer');
const bcrypt=require('bcrypt');
const user = require('../../models/userSchema');
const product = require('../../models/productSchema');
const Cart=require('../../models/cartSchema');
const Banner=require('../../models/bannerSchema')


const loadLandingpage=async(req,res)=>{
    try{
      const banner=await Banner.findOne().sort({_id:-1})
      return res.render('landing',{banner})
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
       const referralCode = req.query.ref || ""; 
        return res.render('signup', { referralCode });
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
      const {name,email,password,ConformPassword,referralCode}=req.body;
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
      req.session.userData={name,email,password,ConformPassword,referralCode: referralCode || null};

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
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    
    if (otp === req.session.userOtp) {
      const { name, email, password, referralCode } = req.session.userData;
      const passwordHash = await securePassword(password);
      const saveUserdata = new User({
        name: name,
        email: email,
        password: passwordHash,
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        wallet: (referralCode && referralCode !== 'null') ? 50 : 0,
        history: (referralCode && referralCode !== 'null') ? [{
          amount: 50,
          type: 'credit',
          description: 'Signup Referral Bonus',
          date: new Date()
        }] : []
      });
      if (referralCode && referralCode !== 'null' && referralCode !== 'undefined') {
        const updateReferrer = await User.findOneAndUpdate(
          { referralCode: referralCode },
          { 
            $inc: { wallet: 100 }, 
            $set: { redeemed: true },
            $push: {
              redeemedUser: { 
                name: name, 
                email: email, 
                date: new Date() 
              },
              history: { 
                amount: 100, 
                type: 'credit',
                description: `Referral Bonus from ${name}`,
                date: new Date()
              } 
            } 
          },
          { new: true }
        );
        console.log("Referrer Update Status:", updateReferrer ? "Success" : "Referrer Not Found");
      }

      await saveUserdata.save();
      req.session.userData = null;
      req.session.userOtp = null;
      req.session.user = saveUserdata._id;

      res.json({ success: true, redirectUrl: '/login' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid OTP, please try again' });
    }
  } catch (error) {
    console.error('Error verify OTP', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
};
const resendOtp=async(req,res)=>{
   try{
    if (!req.session.userData || !req.session.userData.email) {
            return res.status(400).json({success: false,message: 'Session expired. Please signup again.'});
        }
      const email = req.session.userData.email;
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
    const user = req.session.user;
        let cartCount = 0;
        let wishlistCount=0;
        if (user) {
            const cart = await Cart.findOne({ userId: user });
            if (cart) {
                cartCount = cart.items.length; 
            }
            const userData = await User.findById(user);
      if (userData && userData.wishlist) {
        wishlistCount = userData.wishlist.length;
      }
            
        }
   return res.render('home',{cartCount: cartCount,wishlistCount: wishlistCount})
  }catch(error){
     console.log('home page not found')
        res.status(500).send('server error')
  }
}
  const login = async (req,res)=>{
  try{
    console.log("BODY:", req.body);

    const {email,password}=req.body;
    if (!password) {
      return res.render('login', { message: 'Password is required' });
    }
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
const loadShop = async (req, res) => {
    try {
        const user = req.session.user;
        const userData = user ? await User.findById(user) : null;

        let { category, brand, minPrice, maxPrice, search, sort, page } = req.query;
        page = parseInt(page) || 1;
        search=req.query.search||''
        const limit = 6;
        const skip = (page - 1) * limit;
        let query = { 
            isBlocked: false,
            quantity: { $gt: 0 }
        };
        if (search) {
            query.productName = { $regex: search, $options: 'i' };
        }
        if (category) {
            const catArray = Array.isArray(category) ? category : [category];
            query.category = { $in: catArray };
        } 
        if (brand) {
            const brandArray = Array.isArray(brand) ? brand : [brand];
            const foundBrands = await Brand.find({ _id: { $in: brandArray } });
            const brandNames = foundBrands.map(b => b.name);
            if (brandNames.length > 0) {
               query.brand = { $in: brandNames };
             }
          }
        if (minPrice || maxPrice) {
            query.salesPrice = {};
            if (minPrice) query.salesPrice.$gte = parseFloat(minPrice);
            if (maxPrice) query.salesPrice.$lte = parseFloat(maxPrice);
        }
        let sortQuery = { CreatedOn: -1 };
        if (sort === 'az'){
        sortQuery = { productName: 1 };
        }else if (sort === 'za'){
        sortQuery = { productName: -1 };
        }else if (sort === 'low-high'){
        sortQuery = { salesPrice: 1 };
        }else if (sort === 'high-low'){
         sortQuery = { salesPrice: -1 };
        }
        const products = await Product.find(query)
            .populate('category')
            .sort(sortQuery)
            .skip(skip)
            .limit(limit)
            .lean();
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);
        const categories = await Category.find({ islisted: true });
        const brands = await Brand.find({ isBlocked: false });
        const userWishlist = userData ? userData.wishlist.map(id => id.toString()) : [];
        products.forEach(p => {
            p.isWishlisted = userWishlist.includes(p._id.toString());
        });
        let cartCount = 0;
        let wishlistCount=0;
        if (user) {
            const cart = await Cart.findOne({ userId: user });
            cartCount = cart ? cart.items.length : 0;
            const userDatas = await User.findById(user);
      if (userDatas && userDatas.wishlist) {
        wishlistCount = userDatas.wishlist.length;
      }
        }

        res.render('shop', {
            user: userData,
            products,
            category: categories,
            brand: brands,
            totalpages: totalPages,
            currentPage: page,
            search: search || '',
            selectedCategory: category || [],
            selectedBrand: brand || [],
            minPrice: minPrice || '',
            maxPrice: maxPrice || '',
            selectedSort: sort || 'default',
            cartCount,
            wishlistCount
        });

    } catch (error) {
        console.error('Shop Page Error:', error);
        res.status(500).send('Internal server error');
    }
};
const loadrefer=async(req,res)=>{
  try {
     const userId=req.session.user;
     const user=await User.findById(userId);
      let cartCount = 0;
        let wishlistCount=0;
        if (user) {
            const cart = await Cart.findOne({ userId: user });
            cartCount = cart ? cart.items.length : 0;
      if (user && user.wishlist) {
        wishlistCount = user.wishlist.length;
      }
        }
     if (!user.referralCode) {
            user.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            await user.save();
        }
        const referralLink = `${req.protocol}://${req.get('host')}/signup?ref=${user.referralCode}`;
        res.render('refer', { user, referralLink, cartCount, wishlistCount });
  } catch (error) {
    console.log('error',error);
    res.status(500).send('Internal server error')
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
    loadShop,   
    loadrefer,
}