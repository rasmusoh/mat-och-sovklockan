// server.js
// where your node app starts

// init project
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// init sqlite db
const dbFile = "./.data/sqlite.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbFile);

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(() => {
  if (!exists) {
    db.run(
      "CREATE TABLE Ate (id INTEGER PRIMARY KEY AUTOINCREMENT, time DATETIME)"
    );
        db.run(
      "CREATE TABLE Slept (id INTEGER PRIMARY KEY AUTOINCREMENT, from DATETIME,to DATETIME)"
    );
    console.log("New tables Ate and Slept created!");

  } else {
    console.log('Database ready to go!');
    db.each("SELECT * from Ate", (err, row) => {
      if (row) {
        console.log(`Ate record: ${row.time}`);
      }
    });
      db.each("SELECT * from Slept", (err, row) => {
      if (row) {
        console.log(`Slept record: ${row.from}, ${row.to}`);
      }
    });
  }
});

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(`${__dirname}/views/index.html`);
});

// endpoint to get all the ate in the database
app.get("/eats", (request, response) => {
  db.all("SELECT * from Ate", (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});

// endpoint to get all the ate in the database
app.get("/sleeps", (request, response) => {
  db.all("SELECT * from Slept", (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});

// endpoint to add a eating to the database
app.post("/eats", (request, response) => {
  console.log(`add to ate ${request.body.time}`);

  // DISALLOW_WRITE is an ENV variable that gets reset for new projects
  // so they can write to the database
  if (!process.env.DISALLOW_WRITE) {
    const cleansedAte = cleanseString(request.body.time);
    db.run(`INSERT INTO Ate (time) VALUES (?)`, cleansedAte, error => {
      if (error) {
        response.send({ message: "error!" });
      } else {
        response.send({ message: "success" });
      }
    });
  }
});

// endpoint to add a eating to the database
app.post("/sleeps", (request, response) => {
  console.log(`add to slept ${request.body.from} ${request.body.to}`);

  // DISALLOW_WRITE is an ENV variable that gets reset for new projects
  // so they can write to the database
  if (!process.env.DISALLOW_WRITE) {
    const cleansedFrom = cleanseString(request.body.from);    
    const cleansedTo = cleanseString(request.body.to);

    db.run(`INSERT INTO Slept (from, to) VALUES (?)`, cleansedFrom, cleansedTo, error => {
      if (error) {
        response.send({ message: "error!" });
      } else {
        response.send({ message: "success" });
      }
    });
  }
});

// endpoint to clear dreams from the database
app.get("/clearDreams", (request, response) => {
  // DISALLOW_WRITE is an ENV variable that gets reset for new projects so you can write to the database
  if (!process.env.DISALLOW_WRITE) {
    db.each(
      "SELECT * from Dreams",
      (err, row) => {
        console.log("row", row);
        db.run(`DELETE FROM Dreams WHERE ID=?`, row.id, error => {
          if (row) {
            console.log(`deleted row ${row.id}`);
          }
        });
      },
      err => {
        if (err) {
          response.send({ message: "error!" });
        } else {
          response.send({ message: "success" });
        }
      }
    );
  }
});

// helper function that prevents html/css/script malice
const cleanseString = function(string) {
  return string.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// listen for requests :)
var listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});