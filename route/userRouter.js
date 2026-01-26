const express=require('express');
const router=express.Router();
const userControllers=require('../controllers/user/userController');
const passport = require('passport');


router.get('/landing',userControllers. loadLandingpage)
router.get('/login',userControllers.loginPage)
router.post('/login',userControllers.login)
router.get('/signup',userControllers.signupPage)
router.post('/signup',userControllers.signup)
router.post('/verify_otp',userControllers.verifyOtp)
router.post('/resend_otp',userControllers.resendOtp)
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/login'}),(req,res)=>{
    res.redirect('/home')
})
router.get('/home',userControllers.homepage)
module.exports=router