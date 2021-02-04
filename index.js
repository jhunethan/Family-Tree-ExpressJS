const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const mysql = require("mysql");

// const db = mysql.createPool({
//   host: "localhost",
//   user: "root",
//   password: "password",
//   database: "layfamilytreedb",
// });

const db = mysql.createPool({
  host: "eu-cdbr-west-03.cleardb.net",
  user: "b7c8f3e72edffb",
  password: "d02605ff",
  database: "heroku_a335746522f3d45",
});

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/api/get", (req, res) => {
  const sqlSelect = "Select * from familymembers";
  db.query(sqlSelect, (err, result) => {
    console.log("data sent to frontend");
    res.send(result);
    res.end();
  });
});

app.get("/api/getextra", (req, res) => {
  const sqlSelect = "Select * from extradetails";
  db.query(sqlSelect, (err, result) => {
    console.log("data sent to frontend");
    res.send(result);
    res.end();
  });
});

const getTime = () => {
  // current timestamp in milliseconds
  let ts = Date.now();

  let date_ob = new Date(ts);
  let date = date_ob.getDate();
  let month = date_ob.getMonth() + 1;
  let year = date_ob.getFullYear();
  let hours = date_ob.getHours();
  let minutes = date_ob.getMinutes();

  if (date < 10) date = "0" + date;
  if (month < 10) month = "0" + month;

  // prints date & time in YYYY-MM-DD format
  return (
    date + "-" + month + "-" + year + ":" + "[" + hours + ":" + minutes + "]"
  );
};

app.post("/api/insert", (req, res) => {
  var node = req.body;
  var exists = false;
  const sqlSelect = "SELECT * from familymembers WHERE name = ?";
  db.query(sqlSelect, [node.name], (err, result) => {
    try {
      for (let i = 0; i < result.length; i++) {
        if (
          result[i].birthdate === node.birthdate &&
          result[i].generation === node.generation &&
          result[i].name === node.name
        ) {
          exists = true;
          console.log("entry exists");
        }
      }
    } catch {
      exists = false;
    }

    if (exists === false) {
      if (node.pid === "") node.pid = 0;

      const sqlInsert =
        "INSERT INTO `familymembers` (`pid`, `generation`, `name`, `birthdate`, `parent`, `partner`, `isPartner`) VALUES (?,?,?,?,?,?,?);";
      db.query(
        sqlInsert,
        [
          node.pid,
          node.generation,
          node.name,
          node.birthdate,
          node.parent,
          node.partner,
          node.isPartner,
        ],
        (err, result) => {
          console.log(err);
          console.log(result);
        }
      );
    }
  });

  let time = getTime();
  let method = "edit";
  //write to edit history
  const sqlInsert =
    "INSERT INTO `edithistory` (`id`, `time`, `author`, `changes`, `method`) VALUES (?,?,?,?,?);";
  db.query(
    sqlInsert,
    [node.id, time, node.author, node.changes, method],
    (err, result) => {
      console.log(err);
      console.log(result);
      res.send(result);
    }
  );

  res.end();
});

app.post("/api/delete", (req, res) => {
  const id = req.body.id;
  console.log(id);
  let sqlDelete = "DELETE  FROM `familymembers` WHERE id = ?";
  db.query(sqlDelete, [id], (err, result) => {
    console.log(err);
    console.log(result);
    res.end();
  });
});

app.post("/api/update", (req, res) => {
  let node = req.body;
  console.log(node);
  let sqlUpdate =
    "UPDATE `familymembers` SET generation = ?, name = ?, birthdate = ?, pid = ?, isPartner = ?, parent = ?, partner = ? WHERE id = ?";

  //invisible root node is uneditable
  if (node.id !== 0) {
    db.query(
      sqlUpdate,
      [
        node.generation,
        node.name,
        node.birthdate,
        node.pid,
        node.isPartner,
        node.parent,
        node.partner,
        node.id,
      ],
      (err, result) => {
        console.log(err);
        console.log(result);
        res.end();
      }
    );
  }
});

app.post("/api/updateextra", (req, res) => {
  let node = req.body;
  console.log(node);
  let sqlWrite =
    "INSERT INTO `extradetails` (`id`, `location`, `extranames`, `fblink`, `description`, `birthplace`) VALUES (?,?,?,?,?,?);";
  //invisible root node is uneditable
  if (node.id !== 0) {
    db.query(
      sqlWrite,
      [
        node.id,
        node.location,
        node.extranames,
        node.fblink,
        node.description,
        node.birthplace,
      ],
      (err, result) => {
        console.log(err);
        console.log(result);
        if (err) {
          let sqlUpdate =
            "UPDATE `extradetails` SET location = ?, extranames = ?, fblink = ?, description = ?, birthplace = ? WHERE id = ?;";
          db.query(sqlUpdate, [
            node.location,
            node.extranames,
            node.fblink,
            node.description,
            node.birthplace,
            node.id,
          ]);
        }
      }
    );
  }
  res.end();
});

var port = process.env.PORT || 5000;
app.listen(port, function () {
  console.log("Listening on " + port);
});
