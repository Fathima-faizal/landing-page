const Banner=require('../../models/bannerSchema');



const loadbanner=async(req,res)=>{
    try {
        const page=parseInt(req.query.page)||1;
        const limit=5;
        const skip=(page-1)*limit;
        let search=req.query.search||'';
        let query={};
        if(search){
           query.title={$regex:search,$options:'i'}
        }
         const totalorder=await Banner.countDocuments(query);
        const banners=await Banner.find(query)
        .sort({ createdOn: -1 }) 
        .skip(skip)
        .limit(limit)
        res.render('banner',{
            banners,
            currentPage:page,
            totalPages:Math.ceil(totalorder/limit),
            search,
        })
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const getaddbanner=async(req,res)=>{
    try {
        res.render('addBanner')
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal sever error')
    }
}
const postbanner=async(req,res)=>{
    try {
        const {title,description,link,startDate,endDate}=req.body;
        const image = req.file ? req.file.filename : null;
        const newBanner=new Banner({
            title:title,
            description:description,
            link:link,
            startDate:startDate,
            endDate:endDate,
            image:image
        })
        await newBanner.save();
        res.redirect('/admin/banner')
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
 const deletebanner=async(req,res)=>{
    try {
        let id=req.query.id;
        await Banner.findByIdAndDelete(id);
        res.redirect('/admin/banner')
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
 }
module.exports={
    loadbanner,
    getaddbanner,
    postbanner,
    deletebanner,
}