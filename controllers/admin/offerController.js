const Offer=require('../../models/offerSchema');
const Product=require('../../models/productSchema')
const Category=require('../../models/categorySchema')

const loadoffer=async(req,res)=>{
    try {
        const page=parseInt(req.query.page)||1;
        const limit=5;
        const skip=(page-1)*limit;
        let search=req.query.search||'';
        let query={};
        if(search){
           query.offerType={$regex:search,$options:'i'}
        }
         const totalorder=await Offer.countDocuments(query);
        const offers=await Offer.find(query)
        .populate('productId categoryId')
        .sort({ createdOn: -1 }) 
        .skip(skip)
        .limit(limit)
        const products=await Product.find();
        const categories=await Category.find();
        res.render('offer',{
            offers,
            products,
            categories,
            currentPage:page,
            totalPages:Math.ceil(totalorder/limit),
            search,
        })
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const getaddoffer=async(req,res)=>{
    try {
        const products=await Product.find({isBlocked:false});
        const categories=await Category.find({islisted:true})
        res.render('addOffer',{
            products:products,
            categories:categories
        })
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const postoffer=async(req,res)=>{
    try{
    const {offerName,discount,type,targetId,expiryDate}=req.body;
    let selectedTargetId;
        if (Array.isArray(targetId)) {
            selectedTargetId = type === 'Product' ? targetId[0] : targetId[1];
        } else {
            selectedTargetId = targetId;
        }
    const newOffer=new Offer({
        offerName,
        discountPercentage:discount,
        offerType: type,
        productId:type==='Product'?selectedTargetId : null,
        categoryId:type==='Category'?selectedTargetId : null,
        expiryDate:expiryDate,
        isActive:true
    })
    await newOffer.save();
    let productsToUpdate;
        if (type === 'Product') {
            productsToUpdate = await Product.find({ _id: targetId });
        } else {
            productsToUpdate = await Product.find({ category: targetId });
        }
    res.redirect('/admin/offer');
}catch(error){
console.log('error',error);
res.status(500).send('Internal sever error')
}
}
const editoffer=async(req,res)=>{
    try {
        let id=req.params.id;
        const offer=await Offer.findById(id).populate('productId categoryId');
        const products=await Product.find({isBlocked:false});
        const  categories=await Category.find({islisted:true});
        res.render('editOffer',{
            offer,
            products,
            categories
        })
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const editpostoffer=async(req,res)=>{
    try {
        const id = req.params.id;
        const {offerName,discount,type,targetId,expiryDate}=req.body;
        let selectedTargetId;
        if (Array.isArray(targetId)) {
            selectedTargetId = type === 'Product' ? targetId[0] : targetId[1];
        } else {
            selectedTargetId = targetId;
        }
        await Offer.findByIdAndUpdate(id,{
           offerName,
           discountPercentage:discount,
           offerType:type,
           productId:type==='Product'?selectedTargetId:null,
           categoryId:type==='Category'?selectedTargetId:null,
           expiryDate:expiryDate
        },{ new: true })
        res.redirect('/admin/offer')
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal sever error')
    }
}
const deleteoffer=async(req,res)=>{
    try {
        let id=req.query.id;
        await Offer.findByIdAndDelete(id);
        res.redirect(`/admin/offer?message=Item removed successfully`)
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server erro')
    }
}
const activeoffer=async(req,res)=>{
    try {
        let id=req.query.id;
      const offer= await Offer.updateOne({
            _id:id
        },{
            $set:{isActive:true}
        })
        res.redirect('/admin/offer')
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const unactiveoffer=async(req,res)=>{
    try{
    let id=req.query.id;
    await Offer.updateOne({
        _id:id
    },{
        $set:{isActive:false}
    })
    res.redirect('/admin/offer')
}catch(error){
    console.log('error',error);
    res.status(500).send('Internal server error')
}
}
module.exports={
   loadoffer,
   getaddoffer,
   postoffer,
   editoffer,
   editpostoffer,
   deleteoffer,
   activeoffer,
   unactiveoffer
}