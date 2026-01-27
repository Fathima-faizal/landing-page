const User=require('../../models/userSchema');
const mongoose=require('mongoose');
const bcrypt=require('bcrypt');



const adminLoginloaded=async(req,res)=>{
    if(req.session.admin){
        return res.redirect('admin/dashboard')
    }
    res.render('admin-login',{message:null});
}

const adminlogin=async(req,res)=>{
    
     try{
      const {email,password}=req.body;
      const admin=await User.findOne({email,isAdmin:true})
      if(admin){
        const passwordMatch=bcrypt.compare(password,admin.password);
          if(passwordMatch){
            req.session.admin=true;
            return res.redirect('dashboard')
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
const loaddashboard=async(req,res)=>{
      if(req.session.admin){
        try{
            res.render('dashboard');
        }catch(error){
        res.status(500).send('Internal server error')
      }
    }
}
const admilogout=async(req,res)=>{
  try {
     req.session.destroy(error=>{
       if(error){
        console.log('session distruction error',error);
        return res.status(400).send('Admin error')
       }
       return res.redirect('/admin/login')
     })
  } catch (error) {
    console.log('Admin logout error ',error);
    res.status(500).send('Internal server error')
  }
}
module.exports={
    adminLoginloaded,
    adminlogin,
    loaddashboard,
    admilogout,
}