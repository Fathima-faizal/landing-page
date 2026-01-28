const express=require('express');
const router=express.Router();
const userControllers=require('../controllers/user/userController');
const passport = require('passport');
const profileControllers=require('../controllers/user/profileControllers')
const {userAuth,adminAuth}=require('../middleware/auth')


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
router.get('/home',userControllers.homepage);
router.get('/forgot-password',profileControllers.getforgotpasspage);
router.post('/forgot-email-valid',profileControllers.forgotEmailValid);
router.post('/verify-passForgot-otp',profileControllers.verifyForgotPassOtp)
router.get('/resend-password',profileControllers.getRestPasspage);
router.post('/resend_forgot-otp',profileControllers.getresndOtp)
router.post('/reset-password',profileControllers.postNewPassword)
router.get('/profile',userAuth,profileControllers.userProfile)
router.get('/logout',profileControllers.logout)
router.get('/change-email',userAuth,profileControllers.changeEmail)
router.post('/change-email',userAuth,profileControllers.changeEmailValid)
router.post('/verify-email-otp',userAuth,profileControllers.verifyEmailotp)
router.get('/new-email',userAuth,profileControllers.newEmail)
router.post('/update-email',userAuth,profileControllers.updateEmail)
router.post('/resend-email-otp',userAuth,profileControllers.resetEmail)
router.get('/change-password',userAuth,profileControllers.changePassword)
router.post('/change-password',userAuth,profileControllers.changePasswordValid)
router.post('/verify-changePassword-otp',userAuth,profileControllers.verifyChangePasswordOtp)

module.exports=router