const User=require('../../models/userSchema');
const Order=require('../../models/orderSchema');
const Address=require('../../models/addressSchema')

const getorders=async(req,res)=>{
    try {
        const page=parseInt(req.query.page)||1;
        const limit=3;
        const skip=(page-1)*limit;
        let search=req.query.search||'';
        let statusFilter=req.query.status||'';
        search=search.replace(/^#/,'').trim();
        let query={};
        if(search){
            query.orderId={$regex:search,$options:'i'}
        }
        if(statusFilter){
            query.status=statusFilter
        }
        const totalorder=await Order.countDocuments(query);
       const orders = await Order.find(query)
    .populate('userId')
    .sort({ createdOn: -1 }) 
    .skip(skip)
    .limit(limit)
    .lean();
        res.render('orderManagement',{
            orders,
            currentPage:page,
            totalPages:Math.ceil(totalorder/limit),
            search,
           statusFilter,
          
        })
    } catch (error) {
        console.log('error',error)
        res.status(500).send('Internal server error')
    }
}
const updatestatus=async(req,res)=>{
    try {
        const {id}=req.params;
        const {status}=req.body;
        const order=await Order.findById(id);
        order.status=status.toLowerCase();
        await order.save();
        res.json({success:true,message:'Status updated successfully'})
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const viewdetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId)
            .populate('userId') 
            .populate({
                path: 'orderedItems.productId',
                populate: {
                    path: 'category',
                    model: 'category'
                }
            })
            .lean();
            const addressData = await Address.findOne({ "address._id": order.address });
        res.render('Views', { order,addressData});
    } catch (error) {
        console.error('error', error);
        res.status(500).send('Internal server error');
    }
}
const getReview = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;
        let search = req.query.search || '';
        let query = { 'orderedItems.review.isReviewed': true };
        if (search) {
            const users = await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            
            const userIds = users.map(user => user._id);
            query.userId = { $in: userIds };
        }
        const totalReviews = await Order.countDocuments(query);
        const reviews = await Order.find(query)
            .populate('userId', 'name email')
            .populate({
                path: 'orderedItems.productId',
                populate: {
                    path: 'category',
                    model: 'category'
                }
            })
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        res.render('Reviews', {
            reviews,
            currentPage: page,
            totalPages: Math.ceil(totalReviews / limit),
            search: search
        });
    } catch (error) {
        console.log('error', error);
        res.status(500).send('Internal server error');
    }
}
const deleteReview=async(req,res)=>{
    try {
        const { orderId, itemId } = req.query;
        await Order.updateOne(
            { _id: orderId, "orderedItems._id": itemId },
            { 
            $set: { 
            "orderedItems.$.review.comment": null,
            "orderedItems.$.review.rating": null,
            "orderedItems.$.review.isReviewed": false 
             } 
            }
        );
        res.redirect('/admin/Reviews');
    } catch (error) {
        console.error(error);
        res.status(500).send("Error deleting review");
    }
}
 const getcontact=async(req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;
        let search = req.query.search || '';
        let query = {'orderedItems.returnReason':{$ne:null}};
        if (search) {
            const users = await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            
            const userIds = users.map(user => user._id);
            query.userId = { $in: userIds };
        }
        const totalReviews = await Order.countDocuments(query);
        const returns = await Order.find(query)
            .populate('userId', 'name email')
            .populate({
                path: 'orderedItems.productId',
                populate: {
                    path: 'category',
                    model: 'category'
                }
            })
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        res.render('Contact', {
            returns,
            currentPage: page,
            totalPages: Math.ceil(totalReviews / limit),
            search: search
        });
    } catch (error) {
        console.log('error', error);
        res.status(500).send('Internal server error');
    }
 }
const updatereturn=async(req,res)=>{
    try {
        const { orderId, itemId, status } = req.body;
        const normalizedStatus = status.toLowerCase();
        const updatedOrder = await Order.findOneAndUpdate(
            {_id: orderId,"orderedItems._id": itemId},
            {
                $set:{ "orderedItems.$.status": normalizedStatus } 
            },
            { new:true,runValidators: true }
        );
        if (!updatedOrder) {
            return res.status(404).json({ 
                success: false, 
                message: "Order or Item not found" 
            });
        }
        res.json({ 
            success: true, 
            message: `Return status updated to ${status}` 
        });
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}


module.exports={
    getorders,
    updatestatus,
    viewdetails,
    getReview,
    deleteReview,
    getcontact,
    updatereturn,
}