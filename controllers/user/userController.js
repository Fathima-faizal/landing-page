const user=require('../../models/userSchema');



const loadLandingpage=async(req,res)=>{
    try{
      return res.render('landing')
    }catch(error){
        console.log('landing page not found')
        res.status(500).send('server error')
    }
}
const loginPage=async(req,res)=>{
    try{
        return res.render('login')
    }catch(error){
        console.log('login page not found');
        res.status(500).send('server error')
    }
}
const signupPage=async(req,res)=>{
    try{
    return res.render('signup');
    }catch(error){
        console.log('signup pag not found');
        res.status(500).send('server error')
    }
}
const signup=async(req,res)=>{
    const {name,email,password}=req.body;
    try{
     const newUser=new user({name,email,password});
      await newUser.save();
      return res.redirect('login');

    }catch(error){
        console.error('Error for save user',error);
        res.status(500).send('Internal server error')
    }
}





module.exports={
    loadLandingpage,
    loginPage,
    signupPage,
    signup
}