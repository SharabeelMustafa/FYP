const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const session = require('express-session');
const multer = require('multer');
const path = require('path');

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

const mysql = require('mysql');
const { clear } = require('console');
const con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'fyp1'
})

con.connect(function (err) {
  if (err) throw err;
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
app.set("view engine", "ejs");
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

app.get('/', function (req, res) {


  con.query('SELECT * FROM driver', function (err, result) {
    if (err) throw err;
    con.query('SELECT * FROM route', function (err, result1) {
      if (err) throw err;
      res.render('login', { driver: result, route: result1 });
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

          req.session.adminId = result[0].a_id;
          console.log(result[0].a_id);
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

app.get('/dell_si_notif/:N_Id', function (req, res) {
  const n_Id = req.params.N_Id;
  //const userId = req.session.userId; // Current user's ID
  con.query('DELETE FROM si_notification WHERE sin_id = ?', [n_Id], (err) => {
    if (err) throw err;
    res.redirect('/student_dashboard');
  });
})

app.get('/admin_dashboard', checkAdminSession, function (req, res) {
  const ad = req.session.adminId;

  console.log(ad);
  con.query('SELECT * FROM ai_notification WHERE a_id = ?', [ad], function (err, result1) {
    if (err) throw err;
    res.render('admin_dashboard', { notif: result1 });
  });

});



app.get('/admin_sn', checkAdminSession, function (req, res) {
  con.query('SELECT * FROM student', function (err, result) {
    if (err) throw err;
    res.render('admin_send_notfi', { dat: result });

  });

})

app.get('/admin_sn_dc', checkAdminSession, function (req, res) {
  con.query('SELECT * FROM student', function (err, result) {
    if (err) throw err;
    res.render('admin_send_notfi', { dat: result });

  });

})

app.get('/admin_sn_fc', checkAdminSession, function (req, res) {
  con.query('SELECT * FROM facality', function (err, result) {
    if (err) throw err;
    res.render('admin_send_notfi_fc', { dat: result });

  });

})

app.get('/admin_sn_bc', checkAdminSession, function (req, res) {
  con.query('SELECT * FROM bus', function (err, result) {
    if (err) throw err;
    res.render('admin_send_nofti_bc', { dat: result });

  });

})

app.get('/admin_sn_rc', checkAdminSession, function (req, res) {
  con.query('SELECT * FROM student', function (err, result) {
    if (err) throw err;
    res.render('admin_send_notfi', { dat: result });

  });

})



app.post('/send_notification_sc', checkAdminSession, function (req, res) {
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

app.post('/send_notification_fc', checkAdminSession, function (req, res) {
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


app.post('/send_notification_bc', checkAdminSession, function (req, res) {
  const { heading, note, bus_id } = req.body;
  if (!heading || !note || !bus_id) {
    return res.send('Please fill in all fields and select at least one student.');
  }

  const emp_idArray = Array.isArray(bus_id) ? bus_id : [bus_id];

  emp_idArray.forEach(bus_id => {

    const student_regNo_Query = 'SELECT reg_number FROM student WHERE bus_id = ?';
    const facality_empNo_Query = 'SELECT emp_id FROM facality WHERE bus_id = ?';

    con.query(student_regNo_Query, [bus_id], (err, result) => {
      if (err) throw err;
      //console.log(result);

      result.forEach(rn => {

        const insertQuery = 'INSERT INTO si_notification (heading, note,reg_number) VALUES (?, ?, ?)';
        con.query(insertQuery, [heading, note, rn.reg_number], (err) => {
          if (err) throw err;
        });
      })
    });

    con.query(facality_empNo_Query, [bus_id], (err, result) => {
      if (err) throw err;
      console.log(result);

      result.forEach(ei => {

        const insertQuery = 'INSERT INTO fi_notification (heading, notes,emp_id) VALUES (?, ?, ?)';
        con.query(insertQuery, [heading, note, ei.emp_id], (err) => {
          if (err) throw err;
        });
      })
    });
  });

  res.redirect('/admin_sn_bc');
});


app.get('/add_stu_data', checkAdminSession, function (req, res) {
  con.query('SELECT * FROM student', function (err, result) {
    if (err) throw err;

    con.query('SELECT * FROM bus', function (err, result2) {
      if (err) throw err;

      res.render('admin_student_data', { stu: result, bus: result2 });
    });

  });

})


app.post('/signup_stu_by_admin', checkAdminSession, upload.single('profileImage'), async (req, res) => {

  // console.log(req.body);
  // console.log(req.file);

  // return res.redirect("/add_stu_data");

  // Hash the password before saving it
  //const hashedPassword = await bcrypt.hash(password, 10);

  const { name, reg_no, contact, bus_id, email, password } = req.body;
  const pImage = req.file.filename;


  //const hashedPassword = await bcrypt.hash(password, 10);



  const sql = 'INSERT INTO student (reg_number, name, contact, email, password , bus_id , profile_img, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [reg_no, name, contact, email, password, bus_id, pImage, 1];


  con.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into the database:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/add_stu_data');
  });

});


app.get('/add_faculty_data', checkAdminSession, function (req, res) {
  con.query('SELECT * FROM facality', function (err, result) {
    if (err) throw err;

    con.query('SELECT * FROM bus', function (err, result2) {
      if (err) throw err;

      res.render('admin_faculty_data', { stu: result, bus: result2 });
    });

  });

});

app.post('/signup_faculty_by_admin', checkAdminSession, upload.single('profileImage'), async (req, res) => {

  // console.log(req.body);
  // console.log(req.file);

  // return res.redirect("/add_stu_data");

  const { name, emp_id, contact, bus_id, email, password } = req.body;
  const profileImage = req.file.filename;


  //const hashedPassword = await bcrypt.hash(password, 10);


  const sql = 'INSERT INTO facality (emp_id, name, contact, bus_id, email, password, profile_img) VALUES (?, ?, ?, ?, ?, ?, ?)';

  const values = [emp_id, name, contact, bus_id, email, password, profileImage];

  con.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into the database:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/add_faculty_data');
  });

});


app.get('/add_bus_data', checkAdminSession, function (req, res) {
  const sql = `SELECT bus.*,driver.name AS driver_name FROM bus JOIN driver ON Bus.driver_emp_id = Driver.emp_id;`;

  con.query(sql, function (err, result) {
    if (err) throw err;
    con.query('SELECT * FROM route', function (err, result2) {
      if (err) throw err;

      con.query('SELECT * FROM driver', function (err, result3) {
        if (err) throw err;

        res.render('admin_bus_data', { stu: result, route: result2, driver: result3 });
      });

    });

  });

});


app.post('/signup_bus_by_admin', checkAdminSession, async (req, res) => {

  // console.log(req.body);
  // console.log(req.file);

  // return res.redirect("/add_stu_data");

  const { bus_id, driver_emp_id, route_id } = req.body;


  //const hashedPassword = await bcrypt.hash(password, 10);


  const sql = 'INSERT INTO bus (bus_id, driver_emp_id, route_id) VALUES (?, ?, ?)';

  const values = [bus_id, driver_emp_id, route_id];

  con.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into the database:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/add_bus_data');
  });

});


app.get('/add_driver_data', checkAdminSession, function (req, res) {
  con.query('SELECT * FROM driver', function (err, result) {
    if (err) throw err;

    res.render('admin_driver_data', { stu: result });


  });
});

app.post('/signup_driver_by_admin', checkAdminSession, upload.single('profileImage'), async (req, res) => {

  // console.log(req.body);
  // console.log(req.file);

  // return res.redirect("/add_stu_data");

  const { name, contact, emp_id, email, password } = req.body;
  const profileImage = req.file.filename;


  //const hashedPassword = await bcrypt.hash(password, 10);


  const sql = 'INSERT INTO driver (name, contact, emp_id, email, password, profile_img) VALUES (?, ?, ?, ?, ?, ?)';

  const values = [name, contact, emp_id, email, password, profileImage];

  con.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into the database:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/add_driver_data');
  });

});

app.get('/add_route_data', checkAdminSession, function (req, res) {
  con.query('SELECT * FROM route', function (err, result) {
    if (err) throw err;
    con.query('SELECT * FROM stops', function (err, result1) {
      if (err)
        throw err;
      res.render('admin_route_data', { rou: result, stu: result1 });

    });

  });

});


app.post('/signup_route_by_admin', checkAdminSession, async (req, res) => {

  // console.log(req.body);
  // console.log(req.file);

  // return res.redirect("/add_stu_data");

  const { route_name, route_fee } = req.body;


  //const hashedPassword = await bcrypt.hash(password, 10);


  const sql = 'INSERT INTO route (route_name, fee) VALUES (?, ?)';

  const values = [route_name, route_fee];

  con.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into the database:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/add_route_data');
  });

});

// app.post('/signup_stops_by_admin', checkAdminSession, async (req, res) => {

//   console.log(req.body);
//   // console.log(req.file);

//   // return res.redirect("/add_stu_data");

//   const { route_no, stop_name, pickup_time, drop_time } = req.body;


//   //const hashedPassword = await bcrypt.hash(password, 10);


//   const sql = 'INSERT INTO stops (stop_name, pickup_time, drop_time) VALUES (?, ?, ?, ?)';

//   const stops_Array = Array.isArray(stops) ? stops : [stops];
//   const pickup_time_Array = Array.isArray(pickup_time) ? pickup_time : [pickup_time];
//   const drop_time_Array = Array.isArray(drop_time) ? drop_time : [drop_time];

//   stopsArray.forEach(stops => {
//     const values = [route_no, stop_name, pickup_time, drop_time];
//     con.query(sql, values, (err) => {
//       if (err) throw err;
//     });
//     res.redirect('/add_route_data');
//   });

// });

app.post('/signup_stops_by_admin', checkAdminSession, async (req, res) => {
  console.log(req.body);

  const stops = [];
  const { route_no } = req.body;

  // Assuming stops are indexed starting from 0 and incrementing sequentially
  let i = 0;
  while (req.body[`stops[${i}][stop_name]`] !== undefined) {
    const stop = {
      stop_name: req.body[`stops[${i}][stop_name]`],
      pickup_time: req.body[`stops[${i}][pickup_time]`],
      drop_time: req.body[`stops[${i}][drop_time]`]
    };
    stops.push(stop);
    i++;
  }

  stops.forEach(stop => {
    const { stop_name, pickup_time, drop_time } = stop;
    const values = [route_no, stop_name, pickup_time, drop_time];
    const sql = 'INSERT INTO stops (r_id, stop_name, pickup_time, drop_time) VALUES (?, ?, ?, ?)';

    con.query(sql, values, (err) => {
      if (err) throw err;
    });
  });

  res.redirect('/add_route_data');
});

// app.post('/signup_stops_by_admin', checkAdminSession, async (req, res) => {
//   console.log(req.body);

//   const route_no = req.body.route_no;
//   const stops = [];

//   // Extract stop information from req.body
//   const stopNames = req.body['stops[0][stop_name]'];
//   const pickupTimes = req.body['stops[0][pickup_time]'];
//   const dropTimes = req.body['stops[0][drop_time]'];

//   // Check if we have arrays for stops
//   if (Array.isArray(stopNames) && Array.isArray(pickupTimes) && Array.isArray(dropTimes)) {
//       for (let i = 0; i < stopNames.length; i++) {
//           stops.push({
//               stop_name: stopNames[i],
//               pickup_time: pickupTimes[i],
//               drop_time: dropTimes[i]
//           });
//       }
//   } else {
//       // Handle case when there's only one stop (the values would not be arrays)
//       stops.push({
//           stop_name: stopNames,
//           pickup_time: pickupTimes,
//           drop_time: dropTimes
//       });
//   }

//   // Insert stops into the database
//   stops.forEach(stop => {
//       const { stop_name, pickup_time, drop_time } = stop;
//       const values = [route_no, stop_name, pickup_time, drop_time];
//       const sql = 'INSERT INTO stops (r_id, stop_name, pickup_time, drop_time) VALUES (?, ?, ?, ?)';
      
//       con.query(sql, values, (err) => {
//           if (err) throw err;
//       });
//   });

//   res.redirect('/add_route_data');
// });

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


app.post('/stu_singup', upload.single('profileImage'), async (req, res) => {
  const { name, reg_no, email, contact, password } = req.body;
  const profileImage = req.file.filename;

  // Hash the password before saving it
  //const hashedPassword = await bcrypt.hash(password, 10);
  const bus_id = 0;
  const sql = 'INSERT INTO student (reg_number, name, contact, email, password , bus_id , profile_img, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [reg_no, name, contact, email, password, bus_id, profileImage, 1];

  con.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into the database:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/');
  });
});

app.get('/dell_si_notif/:N_Id', function (req, res) {
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
        if (password == result[0].password) {
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


app.get('/student_dashboard', function (req, res) {
  const userId = req.session.userId;
  //console.log(userId);
  const selectQuery_student = 'SELECT * FROM student WHERE reg_number = ?';
  con.query(selectQuery_student, [userId], (err, result) => {
    if (err) throw err;
    //console.log(result);
    const selectQuery_si_notification = 'SELECT * FROM si_notification WHERE reg_number = ? ';
    con.query(selectQuery_si_notification, [userId], (err, result1) => {
      if (err) throw err;
      //console.log(result);


      const currentDate = new Date()
      res.render("student_dashboard", { student: result[0], notification: result1, currentDate });
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