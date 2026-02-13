const Brand=require('../../models/brandSchema');
const Product=require('../../models/productSchema');
const User = require('../../models/userSchema');


const getbrand=async(req,res)=>{
   try {
    let search = req.query.search || '';
           let page = parseInt(req.query.page) || 1;
           const limit = 5;
           const BrandData = await Brand.find({
               name: { $regex: search, $options: "i" }
           })
           .sort({ createdOn: -1 })
           .limit(limit)
           .skip((page - 1) * limit);
           const count = await Brand.countDocuments({
               name: { $regex: search, $options: "i" }
           });
   
           res.render('brand', {
               brand: BrandData,
               totalPages: Math.ceil(count / limit),
               currentPage: page,
               search: search
           });
   } catch (error) {
     console.log('error',error);
     res.status(500).send('Internal server error')
   }
}
const getaddbrand=async(req,res)=>{
    try {
        res.render('addbrand')
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const postaddbrand=async(req,res)=>{
    try {
        const {name}=req.body;
        if(!name){
            res.redirect('/admin/brand')
        }
        const brandExisit=await Brand.findOne({name});
        if(brandExisit){
            return res.status(400).json({message:`Brand already Exisit`})
        }
        const newBrand=new Brand({
            name
        })
        await newBrand.save()
        res.redirect('/admin/brand')
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const geteditbrand=async(req,res)=>{
    try {
        const id=req.params.id;
        const brand=await Brand.findById(id);
        res.render('editbrand',{brand:brand}) 
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const posteditbrand=async(req,res)=>{
    try {
        const id=req.params.id;
        const {name}=req.body;
        const Exisitbrand=await Brand.findOne({
            name:name,
            _id: { $ne: id }
        })
        if(Exisitbrand){
            return res.status(400).json({message:`Brand name already exisist`});
        }
        const updatebrand=await Brand.findByIdAndUpdate(id,{
         name:name
        },{new:true})
        if(updatebrand){
            res.redirect('/admin/brand')
        }else{
            res.status(400).send('brand not found')
        }
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const deletebrand=async(req,res)=>{
    try {
       const id=req.query.id;
       await Brand.findByIdAndDelete(id);
       res.redirect('/admin/brand') 
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal Server error')
    }
}
const blockbrand=async(req,res)=>{
    try {
        const id=req.query.id;
        await Brand.updateOne({
         _id:id
        },{
            $set:{isBlocked:true}
        })
        res.redirect('/admin/brand')
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const unblockbrand=async(req,res)=>{
    try {
         const id=req.query.id;
         await Brand.updateOne({
            _id:id
         },{
            $set:{isBlocked:false}
         })
         res.redirect('/admin/brand')
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}




module.exports={
    getbrand,
    getaddbrand,
    postaddbrand,
    geteditbrand,
    posteditbrand,
    deletebrand,
    blockbrand,
    unblockbrand,
}