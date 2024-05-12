const express = require('express');
const app=express();
const bcrypt = require('bcrypt');
const session = require('express-session');

//const path=require('path');
//app.use(express.static(path.join(__dirname,'public')));


app.set("view engine" , "ejs" );

//conation 

const mysql=require('mysql');
 const con =mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'fyp1'
 })

 con.connect(function(err){
    if(err) throw err;
     console.log('connected');
 })


//model
// Create table if not exists
// const createTableQuery = `CREATE TABLE IF NOT EXISTS students (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     username VARCHAR(255),
//     password VARCHAR(255)
// )`;
// con.query(createTableQuery, (err, result) => {
//   if (err) throw err;
//   console.log('Students table created or exists already');
// });



// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.static('./public'));

app.use(session({
  secret: '@abc', 
  resave: false,
  saveUninitialized: false
}));

//rount 

app.get('/',function (req,res){
  res.render('login');   
})


app.get('/c/:N_Id', function(req, res) {
  const n_Id = req.params.N_Id; // Notification ID to delete
  const userId = req.session.userId; // Current user's ID
  
  con.query('DELETE FROM si_notification WHERE sin_id = ?', [n_Id], (err) => {
    if (err) throw err;
    res.redirect('/student_dashboard');
  });
})



app.post('/login/confirm', (req, res) => {
  const { reg_number, password } = req.body;
  const selectQuery = 'SELECT * FROM student WHERE reg_number = ?';
  con.query(selectQuery, [reg_number], (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      bcrypt.compare(password, result[0].password, (err, bcryptResult) => {
        if (err) throw err;
        if (password==result[0].password) {
          const userId = result[0].reg_number; 
          //console.log(userId);
          req.session.userId = userId;
          res.redirect('/student_dashboard');

        } else {
          res.send('Incorrect password');
          console.log(password);
          console.log(result[0].password);
        }
      });
    } else {
      res.send('User not found');
    }
  });
});


// app.get('/student_dashboard',function (req,res){
//   const userId = req.session.userId;
//    //console.log(userId);
//   const selectQuery_student = 'SELECT * FROM student WHERE reg_number = ?';
//   con.query(selectQuery_student, [userId], (err, result) => {
//     if (err) throw err;
//      //console.log(result);
//       const selectQuery_si_notification='SELECT * FROM si_notification WHERE reg_number = ? '; 
//      con.query(selectQuery_si_notification, [userId], (err, result1) => {
//       if (err) throw err;
//        //console.log(result);
   
     
//     const currentDate = new Date()
//     res.render("student_dashboard", {student : result[0],notification : result1,currentDate});
//     });
//   });

// })





app.listen(3000);