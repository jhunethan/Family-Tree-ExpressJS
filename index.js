const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const mysql = require("mysql");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "password",
  database: "layfamilytreedb",
});

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/api/get", (req, res) => {
  const sqlSelect = "Select * from familymembers";
  db.query(sqlSelect, (err, result) => {
    console.log("data sent to frontend");
    res.send(result);
  });
});

app.post("/api/insert", (req, res) => {
  var node = req.body;

  if (node.pid === "") node.pid = 0;

  const sqlInsert =
    "INSERT INTO `familymembers` (`pid`, `generation`, `name`, `birthdate`, `parent`, `partner`) VALUES (?,?,?,?,?,?);";
  db.query(
    sqlInsert,
    [
      node.pid,
      node.generation,
      node.name,
      node.birthdate,
      node.parent,
      node.partner,
    ],
    (err, result) => {
      console.log(err);
      console.log(result);
    }
  );
});

app.post("/api/delete", (req, res) => {
  const id = req.body.id;
  console.log(id);
  let sqlDelete = "DELETE  FROM `familymembers` WHERE id = ?";
  db.query(sqlDelete, [id], (err, result) => {
    console.log(err);
    console.log(result);
  });
});

app.put("/api/update", (req, res) => {
  let node = req.body;
  console.log(node);
  let sqlUpdate =
    "UPDATE `familymembers` SET generation = ?, name = ?, birthdate = ?, pid = ?, isPartner = ?, parent = ?, partner = ? WHERE id = ?";
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
    }
  );
});

var port = process.env.PORT || 5000;
app.listen(port, function () {
  console.log("Listening on " + port);
});
