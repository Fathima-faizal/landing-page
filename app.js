const express=require('express')
const app=express();
const path=require('path')
const env=require('dotenv').config();
const session=require('express-session');
const db=require('./config/db');
const connectDB = require('./config/db');
const passport=require('./config/passport')
const userRouter=require('./route/userRouter')
const adminRouter=require('./route/adminRouter')
connectDB()



app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(session({
    secret:process.env.SESSION_SECRET,
      resave:false,
      saveUninitialized:true,
      cookie:{
        secure:false,
        httpOnly:true,
        maxAge:72*60*60*1000
      }
}))

app.use(passport.initialize());
app.use(passport.session())

app.set('view engine','ejs')
app.set('views',[path.join(__dirname, 'views/user'), path.join(__dirname, 'views/admin')]);
app.use(express.static(path.join(__dirname,'public')));
app.use((req, res, next) => {
    res.status(404).render('404', { message: "Page Not Found" }); 
  
});
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'))); 
app.use('/uploads', express.static('uploads'));




app.use('/',userRouter);
app.use('/admin',adminRouter)
app.listen(process.env.port,()=>{
    console.log('server running on port')
})

module.exports=app;
