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
  var pidInput = req.body.pid;
  const generationInput = req.body.generation;
  const nameInput = req.body.name;
  const birthdateInput = req.body.birthdate;

  if (pidInput === "") pidInput = 0;

  res.send("working!");

  const sqlInsert =
    "INSERT INTO `familymembers` (`pid`, `generation`, `name`, `birthdate`) VALUES (?,?,?,?);";
  db.query(
    sqlInsert,
    [pidInput, generationInput, nameInput, birthdateInput],
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
  const id = req.body.id;
  const generation = req.body.generation;
  const name = req.body.name;
  const birthdate = req.body.birthdate;
  const pid = req.body.pid;
  const isPartner = req.body.isPartner;
  console.log(`${id} ${generation} ${name} ${birthdate} ${pid} ${isPartner}`)
  let sqlUpdate =
    "UPDATE `familymembers` SET generation = ?, name = ?, birthdate = ?, pid = ?, isPartner = ? WHERE id = ?";
  console.log("activated");
  db.query(
    sqlUpdate,
    [generation, name, birthdate, pid, isPartner, id],
    (err, result) => {
      console.log(err);
      console.log(result);
    }
  );
});

app.listen(3001, () => {
  console.log("running on port 3001");
});