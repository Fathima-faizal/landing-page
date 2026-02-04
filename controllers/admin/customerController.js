const User=require('../../models/userSchema');


const customerinfo=async(req,res)=>{
    try {
        let search='';
        if(req.query.search){
            search=req.query.search;
        }
        let page=1;
        if(req.query.page){
            page=req.query.page
        }
        const limit=5;
        const userData=await User.find({
            isAdmin:false,
            $or:[
                {name:{$regex:search,$options:"i"}},
                {email:{$regex:search,$options:"i"}}
            ]
        })
        .sort({ createdOn: -1 })
       .limit(limit*1)
       .skip((page-1)*limit)
       .exec();

       const count=await User.find({
        isAdmin:false,
            $or:[
                {name:{$regex:search,$options:"i"}},
                {email:{$regex:search,$options:"i"}} 
            ]
       }).countDocuments();
       res.render('customer',{
        data: userData,        
    totalPages: Math.ceil(count / limit), 
    currentPage:parseInt(page),
    search:search
       })

    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
 const bolckCustomer=async(req,res)=>{
    try {
       let id=req.query.id;
       await User.updateOne({
        _id:id
       },{
        $set:{isBlocked:true}
       }) 
       res.redirect('/admin/customer')       
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
 }

 const unblockCustomer=async(req,res)=>{
      try {
        let id=req.query.id;
        await User.updateOne({
            _id:id
        },{
            $set:{isBlocked:false}
        })
        res.redirect('/admin/customer')
      } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
      }
 }







module.exports={
    customerinfo,
    bolckCustomer,
    unblockCustomer,

}