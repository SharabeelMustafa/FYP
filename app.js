const express = require('express');
const app=express();
const bcrypt = require('bcrypt');
const session = require('express-session');
const multer = require('multer');
const path=require('path');

//app.use(express.static(path.join(__dirname,'public')));






// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'public/uploads/'); // Specify the folder to save the uploaded files
  },
  filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)); // Rename the file to include the current timestamp
  }
});



//conation 

const mysql=require('mysql');
const { clear } = require('console');
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
app.set("view engine" , "ejs" );
app.use(express.urlencoded({ extended: false }));
app.use(express.static('./public'));
const upload = multer({ storage: storage });

// Middleware to check if admin is logged in

function checkAdminSession(req, res, next) {
  if (!req.session.isAdmin) {
      return res.redirect('/admin/login');
  }
  next();
}


app.use(session({
  secret: '@abc', 
  resave: false,
  saveUninitialized: false
}));


//rount 

app.get('/',function (req,res){

    
  con.query('SELECT * FROM driver',function(err, result){
    if (err) throw err;
    con.query('SELECT * FROM route' ,function(err, result1){
      if(err) throw err;
      res.render('login',{driver : result , route:result1});   
    }) 

  })
})


// app.get('/stu_singup',function (req,res){
//   res.render('student_singup');
// })



//// admin route 


app.post('/admin/login/confirm', (req, res) => {
  const { username, password } = req.body;
  const selectQuery = 'SELECT * FROM admin WHERE username = ?';
  con.query(selectQuery, [username], (err, result) => {
      if (err) throw err;
      if (result.length > 0) {
          bcrypt.compare(password, result[0].password, (err, bcryptResult) => {
              if (err) throw err;
              if (password == result[0].password) {
                  req.session.isAdmin = true;
                  req.session.adminId = result[0].id;
                  res.redirect('/admin_dashboard');
              } else {
                  res.send('Incorrect password');
              }
          });
      } else {
          res.send('Admin not found');
      }
  });
});



app.get('/admin_dashboard',checkAdminSession,function(req,res){
  res.render('admin_dashboard');
})



app.get('/admin_sn' ,checkAdminSession,function(req,res){
  con.query('SELECT * FROM student',function(err,result){
    if(err) throw err;
    res.render('admin_send_notfi',{dat: result});

  });
 
})

app.get('/admin_sn_dc',checkAdminSession ,function(req,res){
  con.query('SELECT * FROM student',function(err,result){
    if(err) throw err;
    res.render('admin_send_notfi',{dat: result});

  });
 
})

app.get('/admin_sn_fc',checkAdminSession ,function(req,res){
  con.query('SELECT * FROM facality',function(err,result){
    if(err) throw err;
    res.render('admin_send_notfi_fc',{dat: result});

  });
 
})

app.get('/admin_sn_bc',checkAdminSession ,function(req,res){
  con.query('SELECT * FROM bus',function(err,result){
    if(err) throw err;
    res.render('admin_send_nofti_bc',{dat: result});

  });
 
})

app.get('/admin_sn_rc',checkAdminSession ,function(req,res){
  con.query('SELECT * FROM student',function(err,result){
    if(err) throw err;
    res.render('admin_send_notfi',{dat: result});

  });
 
})



app.post('/send_notification_sc',checkAdminSession, function(req, res) {
  const { heading, note, reg_numbers } = req.body;
  if (!heading || !note || !reg_numbers) {
      return res.send('Please fill in all fields and select at least one student.');
  }

  const regNumbersArray = Array.isArray(reg_numbers) ? reg_numbers : [reg_numbers];

  regNumbersArray.forEach(reg_number => {
    
      const insertQuery = 'INSERT INTO si_notification (heading, note, reg_number) VALUES (?, ?, ?)';
      con.query(insertQuery, [heading, note, reg_number], (err) => {
          if (err) throw err;
      });
  });

  res.redirect('/admin_sn');
});

app.post('/send_notification_fc',checkAdminSession, function(req, res) {
  const { heading, note, emp_id } = req.body;
  if (!heading || !note || !emp_id) {
      return res.send('Please fill in all fields and select at least one student.');
  }

  const emp_idArray = Array.isArray(emp_id) ? emp_id : [emp_id];

  emp_idArray.forEach(emp_id => {
    
      const insertQuery = 'INSERT INTO fi_notification (heading, notes, emp_id) VALUES (?, ?, ?)';
      con.query(insertQuery, [heading, note, emp_id], (err) => {
          if (err) throw err;
      });
  });

  res.redirect('/admin_sn_fc');
});


app.post('/send_notification_bc',checkAdminSession, function(req, res) {
  const { heading, note, bus_id } = req.body;
  if (!heading || !note || !bus_id) {
      return res.send('Please fill in all fields and select at least one student.');
  }
  
  const emp_idArray = Array.isArray(bus_id) ? bus_id : [bus_id];

  emp_idArray.forEach(bus_id => {
    
      const student_regNo_Query = 'SELECT reg_number FROM student WHERE bus_id = ?';
      const facality_empNo_Query = 'SELECT emp_id FROM facality WHERE bus_id = ?';

      con.query( student_regNo_Query,[bus_id] ,(err , result) => {
          if (err) throw err;
          //console.log(result);
        
          result.forEach(rn=>{
            
            const insertQuery = 'INSERT INTO si_notification (heading, note,reg_number) VALUES (?, ?, ?)';
            con.query(insertQuery, [heading, note, rn.reg_number], (err) => {
                if (err) throw err;
            });
          })
      });

      con.query( facality_empNo_Query,[bus_id] ,(err , result) => {
          if (err) throw err;
          console.log(result);
        
          result.forEach(ei=>{
            
            const insertQuery = 'INSERT INTO fi_notification (heading, notes,emp_id) VALUES (?, ?, ?)';
            con.query(insertQuery, [heading, note, ei.emp_id], (err) => {
                if (err) throw err;
            });
          })
      });
  });

  res.redirect('/admin_sn_bc');
});


app.get('/add_stu_data',checkAdminSession,function(req,res){
  con.query('SELECT * FROM student',function(err,result){
    if(err) throw err;
    
    con.query('SELECT * FROM bus',function(err,result2){
      if(err) throw err;
      
      res.render('admin_student_data',{stu: result, bus : result2});
    });

  });
   
})


app.post('/signup_stu_by_admin', checkAdminSession,upload.single('profileImage'), async (req, res) => {
  
  // console.log(req.body);
  // console.log(req.file);

  // return res.redirect("/add_stu_data");

  const { name, reg_no, contact, bus_id, email, password } = req.body;
  const profileImage = req.file.profileImage;


  //const hashedPassword = await bcrypt.hash(password, 10);

 
  const sql = 'INSERT INTO student (reg_number, name, contact, bus_id, email, password, is_approved, profile_img) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

  const is_approved = 1;
  const values = [reg_no, name, contact, bus_id, email, password, is_approved, profileImage];

  con.query(sql, values, (err, result) => {
      if (err) {
          console.error('Error inserting data into the database:', err);
          return res.status(500).send('Internal Server Error');
      }
      res.redirect('/add_stu_data');
  });
  
});


app.get('/add_faculty_data',checkAdminSession,function(req,res){
  con.query('SELECT * FROM facality',function(err,result){
    if(err) throw err;
    
    con.query('SELECT * FROM bus',function(err,result2){
      if(err) throw err;
      
      res.render('faculty_data',{stu: result, bus : result2});
    });

  });
   
})


app.get('/add_bus_data', checkAdminSession, function (req, res) {
  const query = `SELECT bus.*,driver.name AS driver_name FROM bus JOIN driver ON Bus.driver_emp_id = Driver.emp_id;`;

  con.query(query, function (err, result) {
    if (err) throw err;
    res.render('bus_data', { stu: result });
  });
});


app.get('/add_driver_data',checkAdminSession,function(req,res){
  con.query('SELECT * FROM driver',function(err,result){
    if(err) throw err;
    
      res.render('driver_data',{stu: result});
  

  });
   
})

app.get('/add_route_data',checkAdminSession,function(req,res){
  con.query('SELECT * FROM driver',function(err,result){
    if(err) throw err;
    
      res.render('route_data',{stu: result});
  

  });
   
})


app.get('/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/admin_dashboard');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});


///  student  

app.post('/stu_singup',upload.single('profileImage'), async (req, res) => {
  const { name, reg_no, email, contact, password } = req.body;
  const profileImage = req.file.filename;

  // Hash the password before saving it
  //const hashedPassword = await bcrypt.hash(password, 10);
  const bus_id= 0;
  const sql = 'INSERT INTO student (reg_number, name, contact, email, password , bus_id , profile_img, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [reg_no, name, contact, email,password,bus_id, profileImage, 1];

  con.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into the database:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/'); 
  });
});

app.get('/dell_si_notif/:N_Id', function(req, res) {
  const n_Id = req.params.N_Id; 
  //const userId = req.session.userId; // Current user's ID
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


app.get('/student_dashboard',function (req,res){
  const userId = req.session.userId;
   //console.log(userId);
  const selectQuery_student = 'SELECT * FROM student WHERE reg_number = ?';
  con.query(selectQuery_student, [userId], (err, result) => {
    if (err) throw err;
     //console.log(result);
      const selectQuery_si_notification='SELECT * FROM si_notification WHERE reg_number = ? '; 
     con.query(selectQuery_si_notification, [userId], (err, result1) => {
      if (err) throw err;
       //console.log(result);
   
     
    const currentDate = new Date()
    res.render("student_dashboard", {student : result[0],notification : result1,currentDate});
    });
  });

})


app.get('/student/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/student_dashboard');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});







app.listen(3000);