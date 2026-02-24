const User=require('../../models/userSchema');
const Product=require('../../models/productSchema');
const Cart=require('../../models/cartSchema');
const Order=require('../../models/orderSchema');
const PDFdocument=require('pdfkit')
  
const getorder = async(req, res) => {
    try {
        const userId = req.session.user;
        const page = parseInt(req.query.page) || 1; 
        const limit = 4; 
        const skip = (page - 1) * limit;
        let search = req.query.search || "";
        search = search.replace(/^#/, "").trim();
        let query = { userId: userId };
        if (search) {
            query.orderId = { $regex: search, $options: 'i' };
        }
        const totalOrders = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate('orderedItems.productId')
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit)
            .lean();   
        res.render('order', {
             orders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
            totalOrders,
            search
         });
    } catch (error) {
        console.log('error', error);
        res.status(500).send('Internal server error');
    }
}
const postorder = async (req, res) => {
    try {
        const userId = req.session.user;
        const { addressId, paymentMethod } = req.body;
        const cart = await Cart.findOne({ userId }).populate('items.proudctId'); 
        
        if (!cart) return res.status(400).json({ status: false, message: "Cart not found" });

        const orderItems = cart.items.map(item => ({
            productId: item.proudctId._id, 
            quantity: item.quantity,
            price: item.price
        }));

        const neworder = new Order({
            userId: userId,
            orderId: 'ORD' + Math.floor(1000 + Math.random() * 9000), 
            orderedItems: orderItems,
            totalPrice: req.session.grandTotal, 
            finalAmount: req.session.grandTotal,
            address: addressId,
            status: 'pending', 
            createdOn: new Date() 
        });

        await neworder.save();
        for (const item of cart.items) {
            await Product.findByIdAndUpdate(item.proudctId._id, {
                $inc: { quantity: -item.quantity }
            });
        }

        await Cart.findOneAndDelete({ userId });
        res.json({ status: true, message: "Order placed successfully" });

    } catch (error) {
        console.log('error', error);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
}
const orderdetails=async(req,res)=>{
    try {
        const orderId=req.params.id;
        const page = parseInt(req.query.page) || 1; 
        const limit = 2; 
        const skip = (page - 1) * limit;
        const order=await Order.findById(orderId).populate({
            path:'orderedItems.productId',
            populate: {
                path: 'category' 
            }
        }).lean();
        const totalItems = order.orderedItems.length;
        const totalPages = Math.ceil(totalItems / limit);
        const paginatedItems = order.orderedItems.slice(skip, skip + limit);
        order.orderedItems = paginatedItems;
        res.render('orderDetails',{
            order,
            currentPage: page,
            totalPages: totalPages
        })
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server errror')
    }
}
const cancelproduct = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ status: false, message: "Order not found" });
        }
        if (order.status === 'delivered') {
            return res.status(400).json({ status: false, message: "Delivered orders cannot be cancelled" });
        }
        for (const item of order.orderedItems) {
            await Product.updateOne(
                { _id: item.productId },
                { $inc: { quantity: item.quantity } }
            );
        }
        await Order.findByIdAndDelete(orderId);
        return res.json({ status: true, message: "Order removed and stock updated" });
    } catch (error) {
        console.log('error', error);
        res.status(500).json({ status: false, message: "Internal server error" });
   }
}
const getreturn=async(req,res)=>{
  try {
    const {orderId,productId}=req.params;
    const order=await Order.findById(orderId).populate({
            path:'orderedItems.productId',
            populate: {
                path: 'category' 
            }
        });
     const item = order.orderedItems.find(i => i.productId._id.toString() === productId);
     res.render('return', { order, item });
  } catch (error) {
    console.log('error',error);
    res.status(500).send('Internal server error')
  }
}
const postreturn=async(req,res)=>{
    try {
        const {orderId,productId,reason}=req.body;
        await Order.updateOne(
            {_id:orderId,
             'orderedItems.productId':productId
            },
            {
                $set:{
                    'orderedItems.$.status':'return request',
                    'orderedItems.$.returnReason':reason
                }

            }
        )
      return res.json({ status: true, message: 'Return Request Submited!' });
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server erro')
    }
}
const getreview = async (req, res) => {
    try {
         const {orderId,productId}=req.params;
    const order=await Order.findById(orderId).populate({
            path:'orderedItems.productId',
            populate: {
                path: 'category' 
            }
        });
     const item = order.orderedItems.find(i => i.productId._id.toString() === productId);
     res.render('review', { order, item });
  } catch (error) {
    console.log('error',error);
    res.status(500).send('Internal server error')
  }
}
const postreview=async(req,res)=>{
    try {
        const { productId, rating, comment, orderId } = req.body;
        await Order.updateOne(
            {_id: orderId,
             "orderedItems.productId": productId,
            },
            {
                 $set: {
                    "orderedItems.$.review":{
                        comment: comment,
                        rating: Number(rating),
                        isReviewed: true
                 }

                 } 
                }
        );
      return res.json({ status: true, message: 'Review submitted!' });
        
    } catch (error) {
       console.log('error',error);
       res.status(500).send('Internal server error')
    }
}
const downloadInvoice = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId)
            .populate('orderedItems.productId')
            .populate('userId'); 

        if (!order) {
            return res.status(404).send('Order not found');
        }
        const doc = new PDFdocument({ margin: 50 });
        const fileName = `invoice_${order._id}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        doc.pipe(res);
        doc.fontSize(25).text('VisionVogue', { align: 'center' });
        doc.fontSize(10).text('Your Vision, Our Style', { align: 'center' });
        doc.moveDown();
        doc.fontSize(18).text('INVOICE', { underline: true });
        doc.moveDown()
        doc.fontSize(12).text(`Order ID: ${order._id}`);
        doc.text(`Date: ${new Date(order.createdOn).toLocaleDateString()}`);
        doc.text(`Payment Method: Cash On Delivery`);
        doc.moveDown();
        doc.fontSize(12).text('Item', 50, 250);
        doc.text('Quantity', 250, 250);
        doc.text('Price', 350, 250);
        doc.text('Total', 450, 250);
        doc.moveTo(50, 265).lineTo(550, 265).stroke();

        let y = 280;
        order.orderedItems.forEach(item => {
            doc.fontSize(10).text(item.productId.productName, 50, y);
            doc.text(item.quantity.toString(), 250, y);
            doc.text(`Rs. ${item.price}`, 350, y);
            doc.text(`Rs. ${item.quantity * item.price}`, 450, y);
            y += 20;
        });
        doc.moveTo(50, y).lineTo(550, y).stroke();
        y += 20;
        doc.fontSize(14).text(`Grand Total: Rs. ${order.finalAmount}`, 400, y, { bold: true });
        doc.fontSize(10).text('Thank you for shopping with VisionVogue!', 50, 700, { align: 'center' });
        doc.end();

    } catch (error) {
        console.error('Invoice Error:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports={
    getorder,
    postorder,
    orderdetails,
    getreturn,
    postreturn,
    getreview,
    postreview,
    downloadInvoice,
    cancelproduct,
}