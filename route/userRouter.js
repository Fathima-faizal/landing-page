const express=require('express');
const router=express.Router();
const userControllers=require('../controllers/user/userController');
const passport = require('passport');
const profileControllers=require('../controllers/user/profileControllers');
const productController=require('../controllers/user/productController')
const {userAuth,adminAuth}=require('../middleware/auth')


router.get('/landing',userControllers. loadLandingpage)
router.get('/login',userControllers.loginPage)
router.post('/login',userControllers.login)
router.get('/signup',userControllers.signupPage)
router.post('/signup',userControllers.signup)
router.post('/verifyOTP',userControllers.verifyOtp)
router.post('/resendOTP',userControllers.resendOtp)
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    req.session.user = req.user._id;
    res.redirect('/home')
})
router.get('/home',userAuth,userControllers.homepage);
router.get('/forgotPassword',profileControllers.getforgotpasspage);
router.post('/forgotEmailvalid',profileControllers.forgotEmailValid);
router.post('/verifyPassForgotOTP',profileControllers.verifyForgotPassOtp)
router.get('/resendPassword',profileControllers.getRestPasspage);
router.post('/resendForgotOTP',profileControllers.getresndOtp)
router.post('/resetPassword',profileControllers.postNewPassword)
router.get('/profile',userAuth,profileControllers.userProfile)
router.get('/logout',profileControllers.logout)
router.get('/changeEmail',userAuth,profileControllers.changeEmail)
router.post('/changeEmail',userAuth,profileControllers.changeEmailValid)
router.post('/verifyEmailOTP',userAuth,profileControllers.verifyEmailotp)
router.get('/newEmail',userAuth,profileControllers.newEmail)
router.post('/updateEmail',userAuth,profileControllers.updateEmail)
router.post('/resendEmailOTP',userAuth,profileControllers.resetEmail)
router.get('/changePassword',userAuth,profileControllers.changePassword)
router.post('/changePassword',userAuth,profileControllers.changePasswordValid)
router.post('/verifyChangePasswordOTP',userAuth,profileControllers.verifyChangePasswordOtp);
router.get('/address',userAuth,profileControllers.address)
router.get('/addAddress',userAuth,profileControllers.addAddress);
router.post('/addAddress',userAuth,profileControllers.postaddAddress)
router.get('/editAddress',userAuth,profileControllers.editAddress)
router.post('/editAddress',userAuth,profileControllers.postEditAddress)
router.get('/deleteAddress',userAuth,profileControllers.deleteAddress);
router.get('/defaultAddress',userAuth,profileControllers.defaultAddress);
router.get('/shop',userAuth,userControllers.loadshoppingpage)
router.get('/filter',userAuth,userControllers.filterproduct);
router.get('/search',userAuth,userControllers.searchproducts);
router.post('/sort',userAuth,userControllers.sortproducts);
router.get('/productDetails',userAuth,productController.productdetails)
module.exports=router