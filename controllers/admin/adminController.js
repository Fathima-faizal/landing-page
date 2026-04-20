const User=require('../../models/userSchema');
const Order=require('../../models/orderSchema')
const mongoose=require('mongoose');
const bcrypt=require('bcrypt');



const adminLoginloaded=async(req,res)=>{
    if(req.session.admin){
        return res.redirect('/admin/dashboard')
    }
    res.render('admin-login',{message:null});
}

const adminlogin=async(req,res)=>{
    
     try{
      const {email,password}=req.body;
      if(!email||!password){
        res.redirect('/admin/login')
      }
      const admin=await User.findOne({email,isAdmin:true})
      if(admin){
        const passwordMatch=bcrypt.compare(password,admin.password);
          if(passwordMatch){
            req.session.admin=true;
            return res.redirect('/admin/dashboard')
          }else{
            return res.redirect('login');
          }
      }else{
        return res.redirect('login');
      }
     }catch(error){
      console.log('login error',error);
      return res.status(400).send('page not found')
     }
}
const loaddashboard = async (req, res) => {
  if (req.session.admin) {
   try {
    const userCount = await User.countDocuments({ isAdmin: false });
    const orderCount = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
    { 
    $match: { 
    $or: [
    { paymentMethod: { $in: ['Wallet', 'Razorpay'] } },
     { paymentMethod: 'COD', status: 'delivered' }
     ]
    } 
     },
     { $group: { _id: null, total: { $sum: "$finalAmount" } } }
    ]);
    const monthlySales = await Order.aggregate([
      { 
      $match: { 
      $or: [
      { paymentMethod: { $in: ['Wallet', 'Razorpay'] } },
   { paymentMethod: 'COD', status: 'delivered' }          
   ]
  } 
  },
  {
  $group: {
  _id: { $month: "$createdOn" },
  revenue: { $sum: "$finalAmount" }
   }
  },
  { $sort: { "_id": 1 } }
  ]);
   const salesReport = await Order.find({
   $or: [
   { paymentMethod: { $in: ['Wallet', 'Razorpay'] } },
  { paymentMethod: 'COD', status: 'delivered' }
  ]
  })
  .sort({ createdOn: -1 })
  .limit(5);

   res.render('dashboard', {
  userCount,
  orderCount,
  revenue: totalRevenue[0] ? totalRevenue[0].total : 0,
  salesReport,
 chartData: JSON.stringify(monthlySales)
   });
  } catch (error) {
  res.status(500).send('Internal server error');
  }
    }
};
const salesreport=async(req,res)=>{
  try {
    let {startDate,endDate,filterType}=req.query;
   let query = {
    $or: [
     { paymentMethod: { $in: ['Wallet', 'Razorpay'] } },
     { paymentMethod: 'COD', status: { $in: ['delivered', 'cancelled', 'returned'] } }
    ]
    };
    const now=new Date();
    if(filterType==='daily'){
      query.createdOn={$gte:new Date(now.setHours(0,0,0,0))}
    }else if(filterType==='weekly'){
      query.createdOn={$gte:new Date(now.setDate(now.getDate()-7))}
    }else if(filterType==='yearly'){
      query.createdOn={$gte:new Date(now.getFullYear(),0,1)}
    }else if(startDate&&endDate){
      query.createdOn={$gte:new Date(startDate),$lte:new Date(endDate)}
    }
    const report=await Order.find(query).sort({createdOn:-1});
    res.json(report)
  } catch (error) {
    console.log('error',error);
    res.status(500).send('Internal server error')
  }
}
const admilogout=async(req,res)=>{
  try {
     req.session.admin = null; 
        res.redirect('/admin/login')
  } catch (error) {
    console.log('Admin logout error ',error);
    res.status(500).send('Internal server error')
  }
}
module.exports={
    adminLoginloaded,
    adminlogin,
    loaddashboard,
    salesreport,
    admilogout,
}