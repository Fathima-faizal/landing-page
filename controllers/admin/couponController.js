const Coupon=require('../../models/couponSchema');

const getcoupon=async(req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1; 
        const search = req.query.search || "";
        const limit = 4; 
        const skip = (page - 1) * limit;
        let filter = {};
        if (search) {
            filter = {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { couponCode: { $regex: search, $options: "i" } }
                ]
            };
        }
        const totalCoupons = await Coupon.countDocuments(filter);
        const coupons = await Coupon.find(filter)
            .sort({ createdOn: -1 }) 
            .skip(skip)
            .limit(limit);
            const totalPages = Math.ceil(totalCoupons / limit);
        res.render('coupon',{
            coupons,
            currentPage: page,
            totalPages: totalPages,
            search:search
        })
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const addcoupon=async(req,res)=>{
    try {
        res.render('addCoupon')
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const postcoupon=async(req,res)=>{
 try {
    const data={
        name:req.body.name,
        couponCode:req.body.couponCode,
        startdate:new Date(req.body.startdate+'T00:00:00'),
        enddate:new Date(req.body.Enddate+'T00:00:00'),
        Minimumprice:parseInt(req.body.Minimumprice)
    }
    const newCoupon= new Coupon({
        name:data.name,
        couponCode:data.couponCode,
        createdOn:data.startdate,
        expireOn:data.enddate,
        minimumPrice:data.Minimumprice
    })
    await newCoupon.save();
    return res.status(200).json({ status: true, message: "Coupon added successfully" });
 } catch (error) {
    console.log('error',error);
    res.status(500).json({ status: false, message: error.message })
 }
}
const editcoupon=async(req,res)=>{
    try {
        let id=req.params.id;
        const coupon=await Coupon.findById(id);
        res.render('editCoupon',{coupons:coupon})
    } catch (error) {
        console.log('error',error);
        res.status(500).send('internal server error')
    }
}
const posteditCoupon=async(req,res)=>{
    try {
        const id=req.params.id;
        const {name,couponCode,startdate,Enddate,Minimumprice}=req.body;
        const ExistingCoupon=await Coupon.findOne(
            {$or:[
                {name:name},
                {couponCode:couponCode},
            ],
            _id:{$ne:id}
        }
        )
        if(ExistingCoupon){
          return  res.status(400).json({message:`Coupon with this name or code already exists`})
        }
        const updateCoupon=await Coupon.findByIdAndUpdate(
            id,
            {
                name:name,
                couponCode:couponCode,
                createdOn:new Date(startdate),
                expireOn:new Date(Enddate),
                minimumPrice:parseInt(Minimumprice)
            },{new:true}
        )
        if(updateCoupon){
          return res.status(200).json({ 
                success: true, 
                message: "Coupon successfully updated" 
            });
        }else{
          return res.status(404).json({ 
                success: false, 
                message: "Coupon not found" 
            });
        }
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const listCoupon=async(req,res)=>{
 try {
        let id=req.query.id;
        await Coupon.updateOne({
            _id:id
        },{
            $set:{islisted:true}
        })
        res.redirect('/admin/coupon')
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const unlistCoupon=async(req,res)=>{
    try {
        let id=req.query.id;
        await Coupon.updateOne({
            _id:id
        },{
            $set:{islisted:false}
        })
        res.redirect('/admin/coupon')
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const deleteCoupon=async(req,res)=>{
    try {
        let id=req.query.id;
        await Coupon.findByIdAndDelete(id);
        res.redirect('/admin/coupon')
    } catch (error) {
       console.log('error',error);
       res.status(500).send('Internal server error') 
    }
}
module.exports={
 getcoupon,
 addcoupon,
 postcoupon,
 editcoupon,
 posteditCoupon,
 listCoupon,
 unlistCoupon,
 deleteCoupon
}