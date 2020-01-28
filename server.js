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
      "CREATE TABLE Activity (id INTEGER PRIMARY KEY AUTOINCREMENT, type varchar(64),fromTime DATETIME,toTime DATETIME)"
    );
    console.log("New table Activity created!");
  } else {
    console.log("Database ready to go!");
    db.each("SELECT * from Ate", (err, row) => {
      if (row) {
        console.log(`record: ${row.type}, ${row.fromTime}, ${row.toTime}`);
      }
    });
  }
});

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(`${__dirname}/views/index.html`);
});

// endpoint to get all the activities in the database
app.get("/activities", (request, response) => {
  db.all("SELECT * from Activities", (err, rows) => {
    response.send(
      JSON.stringify(
        rows.map(x => ({ type: x.type, from: x.fromTime, to: x.toTime }))
      )
    );
  });
});

// endpoint to add a eating to the database
app.post("/activities", (request, response) => {
  console.log(
    `add to activities ${request.body.type}, ${request.body.fromTime},${request.body.toTime}`
  );

  // DISALLOW_WRITE is an ENV variable that gets reset for new projects
  // so they can write to the database
  if (!process.env.DISALLOW_WRITE) {
    const cleansedType = cleanseString(request.body.type);
    const cleansedFrom = cleanseString(request.body.from);
    const cleansedTo = cleanseString(request.body.to);
    db.run(
      `INSERT INTO Activity (type, fromTime, toTime) VALUES (?)`,
      cleansedType,
      cleansedFrom,
      cleansedTo,
      error => {
        if (error) {
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
