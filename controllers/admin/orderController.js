const User=require('../../models/userSchema');
const Order=require('../../models/orderSchema');
const Address=require('../../models/addressSchema');
const Product=require('../../models/productSchema')
const getorders=async(req,res)=>{
    try {
        const page=parseInt(req.query.page)||1;
        const limit=4;
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
        if(order.status==='approve'){
            const user = await User.findById(order.userId);
            if (user) {
                const refundAmount = order.finalAmount;
                user.wallet = (user.wallet || 0) + refundAmount;
                user.history.push({
                    description: `Refund for Approved Return #${order.orderId.toString().slice(-6)}`,
                    amount: refundAmount,
                    type: 'credit',
                    status: 'Completed',
                    date: new Date()
                });
                await user.save();
                for (const item of order.orderedItems) {
                    await Product.findByIdAndUpdate(item.productId, {
                        $inc: { quantity: item.quantity }
                    });
                }
            }
        }
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

module.exports={
    getorders,
    updatestatus,
    viewdetails,
    getReview,
    deleteReview,
}