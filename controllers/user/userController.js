const User=require('../../models/userSchema');
const Category=require('../../models/categorySchema');
const Product=require('../../models/productSchema');
const Brand=require('../../models/brandSchema')
const env=require('dotenv').config
const nodemailer=require('nodemailer');
const bcrypt=require('bcrypt');
const user = require('../../models/userSchema');
const product = require('../../models/productSchema');
const Cart=require('../../models/cartSchema')
// const { search } = require('../../route/userRouter');
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
    const user = req.session.user;
        let cartCount = 0;
        if (user) {
            const cart = await Cart.findOne({ userId: user });
            if (cart) {
                cartCount = cart.items.length; 
            }
        }
   return res.render('home',{cartCount: cartCount})
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
const loadshoppingpage=async(req,res)=>{
  try {
    const user=req.session.user;
    let cartCount = 0;
    if(user){
      const cart = await Cart.findOne({ userId: user });
      if(cart){
        cartCount = cart.items.length;
      }
    }
    const userData=await User.findOne({_id:user});
    const userWishlist = userData ? userData.wishlist.map(id => id.toString()) : [];
    const category=await Category.find({islisted:true});
    const categoryIds=category.map((Category)=>Category._id.toString());
    let search = req.query.search || '';
    const page=parseInt(req.query.page)||1;
    const limit=4;
    const skip=(page-1)*limit;
    const product=await Product.find({
      isBlocked:false,
      category:{$in:categoryIds},
      quantity:{$gt:0}

    }).populate('category').sort({CreatedOn:-1})
    .skip(skip)
    .limit(limit)
    .lean();
    product.forEach(product => {
      product.isWishlisted = userWishlist.includes(product._id.toString());
    });
    const totalproducts=await Product.countDocuments({
      isBlocked:false,
      category:{$in:categoryIds},
      quantity:{$gt:0}
    })
    const currentpage=Math.ceil(totalproducts/limit);
    const brand=await Brand.find({isBlocked:false});
  
    const categoryWithIds=category.map(category=>({_id:category.id,name:category.name}));

    res.render('shop',{
      user:userData,
      products:product,
      category:categoryWithIds,
      brand:brand,
      totalproducts:totalproducts,
      totalpages: currentpage,  
      currentPage: page,      
       search:search,
       cartCount: cartCount
    })
  } catch (error) {
    console.log('error',error);
    res.status(500).send('Internal server error')
  }
}
const filterproduct=async(req,res)=>{
  try {
       const user=req.session.user;
       const category=req.query.category;
       const brand=req.query.brand;
       const minPrice=parseFloat(req.query.minPrice);
       const maxPrice=parseFloat(req.query.maxPrice);
        let search = req.query.search || '';
       const findcategory=category? await Category.findOne({_id:category}):null;
       const findbrand=brand? await Brand.findOne({_id:brand}):null;
       const brands=await Brand.find({}).lean();
       const query={
        isBlocked:false,
        quantity:{$gt:0}
       }
          if(findcategory){
            query.category=findcategory._id;
          }
          if(findbrand){
            query.brand=findbrand.name;
          }
          if(!isNaN(minPrice)||!isNaN(maxPrice)){
            query.salesPrice={};
            if(!isNaN(minPrice)){
              query.salesPrice.$gte=minPrice;
            };
            if(!isNaN(maxPrice)){
              query.salesPrice.$lte=maxPrice;
            }
          }
          let findproduct=await Product.find(query).populate('category').lean();
          findproduct.sort((a,b)=>new Date(b.CreatedOn)-new Date(a.CreatedOn))
          const categorires=await Category.find({islisted:true});
          let itemspage=4;
          let currentPage=parseInt(req.query.page)||1;
          let startIndex=(currentPage-1)*itemspage;
          let endIndex=startIndex+itemspage;
          let totalpages=Math.ceil(findproduct.length/itemspage)
          let currentproduct=findproduct.slice(startIndex,endIndex);
          let userData=null;
          if(user){
            userData=await User.findOne({_id:user});
            if(userData){
              const searchentry={
                category:findcategory?findcategory._id:null,
                brand:findbrand?findbrand.name:null,
                searchOn:new Date()
              }
              userData.searchHistory.push(searchentry);
              await userData.save()
            }
          }
          req.session.filteredProduct=currentproduct;
          res.render('shop',{
            user:userData,
            products:currentproduct,
            category:categorires,
            brand:brands,
            totalpages,
            currentPage,
            selectedcategory:category||null,
            selectedbrand:brand||null,
            search:search,
            minPrice:minPrice||'',
            maxPrice:maxPrice||''
          })
  } catch (error) {
    console.log('error',error);
    res.status(500).send('Internal server error')
  }
}
const searchproducts=async(req,res)=>{
  try {
    const user=req.session.user;
    const userData=await User.findOne({_id:user});
    let search=req.query.search;
    const brand=await Brand.find({}).lean();
    const category=await Category.find({islisted:true}).lean();
    const categorires=category.map((category=>category._id.toString()));
    let searchresult=[];
    if(req.session.filteredProduct&&req.session.filteredProduct.length>0){
      searchresult=req.session.filteredProduct.filter((product)=>product.productName.toLowerCase().includes(search.toLowerCase()));
      
    }else{
      searchresult=await Product.find({
        productName:{$regex:search , $options:'i'},
        isBlocked:false,
        quantity:{$gt:0},
        category:{$in:categorires},
      })
    }
      searchresult.sort((a,b)=>new Date(b.createOn)-new Date(a.createOn));
      let itemsPage=4;
      let currentPage=parseInt(req.query.page)||1;
      let startIndex=(currentPage-1)*itemsPage;
      let endIndex=startIndex+itemsPage;
      let totalpages=Math.ceil(searchresult.length/itemsPage);
      const currentproduct=searchresult.slice(startIndex,endIndex);
      res.render('shop',{
        user:userData,
        products:currentproduct,
        category:category,
        brand:brand,
        totalpages,
        currentPage,
        count:searchresult.length,
        search:search
      })
  } catch (error) {
    console.log('error',error);
    res.status(500).send('Internal server error')
  }
}
const sortproducts=async(req,res)=>{
  try {
    const user=req.session.user;
    const userData=user?await User.findOne({_id:user}):null;
    const option=req.body.sortOption;
    const brand=await Brand.find({}).lean();
    const category=await Category.find({islisted:true}).lean();
    let products=req.session.filteredProduct||await Product.find({
      isBlocked:false,
      quantity:{$gt:0}
    }).populate('category').lean();
    if(option==='az'){
      products.sort((a,b)=>a.productName.localeCompare(b.productName))
    }else if(option==='za'){
      products.sort((a,b)=>b.productName.localeCompare(a.productName));
    }else if(option==='low-high'){
      products.sort((a,b)=>a.salesPrice-b.salesPrice);
    }else if(option=='high-low'){
      products.sort((a,b)=>b.salesPrice-a.salesPrice)
    }
    let itemsPage=4;
    let currentPage=parseInt(req.query.page)||1;
    let totalpages=Math.ceil(products.length/itemsPage);
    let startIndex=(currentPage-1)*itemsPage;
    let endIndex=startIndex+itemsPage;
    const currentproducts=products.slice(startIndex,endIndex);
   res.render('shop',{
    user:userData,
    category:category,
    products:currentproducts,
    brand:brand,
    totalpages,
    currentPage,
    search:'',
    selectedSort:option
   })
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
    loadshoppingpage,
    filterproduct,
    searchproducts,
    sortproducts,
}