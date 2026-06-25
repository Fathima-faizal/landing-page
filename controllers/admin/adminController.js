const User=require('../../models/userSchema');
const Order=require('../../models/orderSchema');
const product=require('../../models/productSchema');
const Category=require('../../models/categorySchema');
const Status=require('../../constants/statusCode');
const Error=require('../../constants/errorMessage');
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
const loadDashboard = async (req, res) => {
    try {
        const userCount = await User.countDocuments({ isBlocked: false });
        
        const deliveredOrders = await Order.find({ status: 'delivered' });
        const orderCount = deliveredOrders.length;
        const revenueData = await Order.aggregate([
            { $match: { status: 'delivered' } }, 
            { $group: { _id: null, total: { $sum: '$finalAmount' } } }
        ]);
        const revenue = revenueData.length > 0 ? revenueData[0].total : 0;

        const topProducts = await Order.aggregate([
            { $match: { status: 'delivered' } },
            { $unwind: '$orderedItems' }, 
            { $group: {
                _id: '$orderedItems.productId',
                totalQty: { $sum: '$orderedItems.quantity' }
            }},
            { $sort: { totalQty: -1 } },
            { $limit: 2 },
            { $lookup: {
                from: 'products', 
                localField: '_id',
                foreignField: '_id',
                as: 'productInfo' 
            }},
            { $unwind: '$productInfo' }, 
            { $project: {
                productName: '$productInfo.productName',
                totalQty: 1
            }}
        ]);

        const topCategories = await Order.aggregate([
            { $match: { status: 'delivered' } },
            { $unwind: '$orderedItems' }, 
            { $lookup: {
                from: 'products',
                localField: 'orderedItems.productId',
                foreignField: '_id',
                as: 'productInfo' 
            }},
            { $unwind: '$productInfo' },
            { $group: {
                _id: '$productInfo.category',
                itemCount: { $sum: '$orderedItems.quantity' }
            }},
            { $sort: { itemCount: -1 } },
            { $limit: 2 },
            { $lookup: {
                from: 'categories', 
                localField: '_id',
                foreignField: '_id',
                as: 'categoryInfo' 
            }},
            { $unwind: '$categoryInfo' },
            { $project: {
                categoryName: '$categoryInfo.name',
                itemCount: 1
            }}
        ]);

        const currentYear = new Date().getFullYear();
        const monthlyRevenue = await Order.aggregate([
            { 
                $match: { 
                    status: 'delivered',
                    $expr: { $eq: [{ $year: '$createdOn' }, currentYear] }
                }
            },
            { 
                $group: {
                    _id: { $month: '$createdOn' },
                    revenue: { $sum: '$finalAmount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const salesReport = await Order.find({ status: 'delivered' }).sort({ createdOn: -1 }).limit(5);
        
        res.render('dashboard', {
            userCount,
            orderCount,
            revenue,
            topProducts,
            topCategories,
            salesReport,
            chartData: JSON.stringify(monthlyRevenue) 
        });

    } catch (error) {
        console.error("Dashboard Loading Error:", error);
        res.status(500).send("Internal Server Error");
    }
};
const salesreport = async (req, res) => {
    try {
        let { startDate, endDate, filterType } = req.query;
        let query = { status: 'delivered' };
        const now = new Date();
        
        if (filterType === 'daily') {
            query.createdOn = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
        } else if (filterType === 'weekly') {
            query.createdOn = { $gte: new Date(now.setDate(now.getDate() - 7)) };
        } else if (filterType === 'yearly') {
            query.createdOn = { $gte: new Date(now.getFullYear(), 0, 1) };
        } else if (startDate && endDate) {
            let end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.createdOn = { $gte: new Date(startDate), $lte: end };
        }
        const report = await Order.find(query)
                                  .sort({ createdOn: -1 })
                                  .limit(5)
                                  
        res.json(report);
    } catch (error) {
        console.log('error', error);
        res.status(500).send('Internal server error');
    }
};
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
    loadDashboard,
    salesreport,
    admilogout,
}