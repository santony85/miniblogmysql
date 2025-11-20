const express = require('express');
const fs = require('fs');
const https = require('https');

const app = express();
const mysql = require('mysql');
var session = require('client-sessions');


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');

// Charger les certificats SSL
const options = {
  key: fs.readFileSync('/tmp/certs/privkey.pem'),
  cert: fs.readFileSync('/tmp/certs/fullchain.pem')
};

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

app.use(session({
 cookieName: 'session',
 secret: 'MonCodeSecretSession', 
 duration: 30 * 60 * 10000,
 activeDuration: 5 * 60 * 10000,
 httpOnly: true,
 secure: true,
 ephemeral: true
}));

//require('dotenv').config();
//const mysql = require('mysql2');

/*const connection = mysql.createConnection(process.env.DATABASE_URL);

connection.connect(err => {
  if (err) throw err;
  console.log('ConnectÃ© Ã  la base MySQL Railway !');
});*/

var connection = mysql.createConnection({
    host     : '127.0.0.1',
    user     : 'sqlasantero',
    password : 'savary',
    database : 'asantero_miniblog',
    ssl  : {
      rejectUnauthorized: false
    }
  });
   
connection.connect(function(err){
    if(err)throw err;
    console.log("Connection ok")
});

const now = new Date();
const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

function requireLogin(req, res, next) {
  if (req.session.user === undefined) {
     res.render('login.ejs', {page: "login"});
    } else {
      next();
    }
};

app.post('/login', function (req, res) {
 var login = req.body.login.toString();
 var mdp = req.body.mdp.toString();
 if(login== 'monlogin' && mdp=='Passw0rd'){
   req.session.user={login:login,mdp :mdp};
   res.redirect('/');
 }
 else res.render('login.ejs') ;
 });

app.get('/logout', function (req, res) {
    req.session.reset();
    res.redirect('/');
});

app.get('/article/:id',(req, res) => {
    let id=req.params.id;
    connection.query('SELECT * FROM articles WHERE id='+id, (err, results) => {
      if (err) return;
      connection.query( 'SELECT * FROM comments WHERE idArticle='+id, (err, results2) => {
        if (err) return;
        res.render('article.ejs',{item:results[0],comments:results2});
      });  
    });
});

app.post('/article/:id',(req, res) => {
    let id=req.params.id;

    const sql = 'INSERT INTO comments (pseudo, comm, dateajout,idArticle) VALUES (?, ?, ?, ?)';
    const values = [req.body.from, req.body.comm,formattedDate,id];
    connection.query(sql, values, (err, result) => {
      if (err) throw err;
      console.log('Row inserted with ID:', result.insertId);
    });
    res.redirect(`/article/${id}`);
   });

app.get('/new',(req, res) => {
    res.render('new.ejs');  
   });

app.post('/new',(req, res) => {
    const sql = 'INSERT INTO articles (title, content, image) VALUES (?, ?, ?)';
    const values = [req.body.title, req.body.content,req.body.image];
    connection.query(sql, values, (err, result) => {
      if (err) throw err;
      console.log('Row inserted with ID:', result.insertId);
    });
    res.redirect('/');
   });

app.get('/',(req, res) => {
  connection.query('SELECT * FROM articles', (err, results) => {
    if (err)return;
    res.render('index.ejs',{articles:results});
  });
});


/* api */
app.get('/api/list/articles',(req, res) => {
  connection.query('SELECT * FROM articles', (err, results) => {
    if (err)return;
    res.json(results);
  });
});

app.get('/api/list/comments/:id',(req, res) => {
  let id=req.params.id;
  connection.query('SELECT * FROM comments where idArticle='+id, (err, results) => {
    if (err)return;
    res.json(results);
  });
});

app.post('/api/newarticle',(req, res) => {

    const sql = 'INSERT INTO articles (title, content, image) VALUES (?, ?, ?)';
    const values = [req.body.title, req.body.content,req.body.image];
    connection.query(sql, values, (err, result) => {
      if (err) throw err;
      console.log('Row inserted with ID:', result.insertId);
    });
    res.send(200);
   });

app.post('/api/newcomment/:id',(req, res) => {
    let id=req.params.id;
    const sql = 'INSERT INTO comments (pseudo, comm, dateajout,idArticle) VALUES (?, ?, ?, ?)';
    const values = [req.body.pseudo, req.body.comm,formattedDate,id];
    connection.query(sql, values, (err, result) => {
      if (err) throw err;
      console.log('Row inserted with ID:', result.insertId);
    });
    res.send(200);
   });



// Lancer le serveur HTTPS
https.createServer(options, app).listen(10000, () => {
  console.log('Serveur HTTPS démarré sur le port 10000');
});



/*app.listen(10000, () => {
 console.log("Serveur dÃ©marrÃ©");
});*/
