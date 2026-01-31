const passport=require('passport');
const googleSrategy=require('passport-google-oauth20').Strategy;
const User=require('../models/userSchema');
 const { errorMonitor } = require('nodemailer/lib/xoauth2');
const env=require('dotenv').config();


passport.use(new googleSrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://gh7thp49-3000.inc1.devtunnels.ms/auth/google/callback",
},
async(asscessToken,refreshToken,profile,done)=>{
   try{
    let user=await User.findOne({googleId:profile.id});
    if(user){
        return done(null,user);
    }else{
        user=new User({
            name:profile.displayName,
            email:profile.emails[0].value,
            googleId:profile.id,
        
        });
        await user.save();
        return done(null,user)
    }
   }catch(error){
       return done(error,null)
   }
}
));
passport.serializeUser((user,done)=>{
    done(null,user.id);

})

passport.deserializeUser((id,done)=>{
    User.findById(id)
    .then(user=>{
        done(null,user);

    })
    .catch(err=>{
        done(err,null)
    });

})
module.exports=passport;
