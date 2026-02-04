
const User=require('../models/userSchema');
const userAuth=(req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then(data=>{
            if(data && !data.isBlocked){
                next();
            }else{
                req.session.user = null;
                res.redirect('/login')
            }
        })
        .catch(error=>{
         console.log('Error in User auth middleware');
         res.status(500).send('Interval server error')
        })
    }else{
        res.redirect('/login')
    }
}
 const adminAuth = (req, res, next) => {
    if (req.session.admin) { 
        next();
    } else {
        res.redirect('/admin/login'); 
    }
}

 module.exports={
    userAuth,
    adminAuth
 }