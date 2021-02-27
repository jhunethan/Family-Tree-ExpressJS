const express = require("express");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;
const app = express();
const mysql = require("mysql");
const fs = require("fs");

require("dotenv").config();

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

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

app.use(express.static("public"));
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

app.get("/api/get", (req, res) => {
  var sqlSelect = "Select * from familymembers";
  db.query(sqlSelect, (err, result) => {
    console.log("data sent to frontend");
    var data = result;
    db.query("Select * from extradetails", (err, result) => {
      console.log("extra details sent to frontend");
      for (let x = 0; x < result.length; x++) {
        for (let i = 0; i < data.length; i++) {
          if (result[x].id === data[i].id) {
            data[i].extradetails = result[x];
          }
        }
      }
      res.send(data);
    });
  });
});

app.get("/api/get/edithistory", (req, res) => {
  const sqlSelect = "Select * from edithistory";
  db.query(sqlSelect, (err, result) => {
    console.log("data sent to frontend");
    res.send(result);
    res.end();
  });
});

// app.get("/api/get/photos/user", (req, res) => {
//   // directory path
//   const dir = "./public/";
//   let check = false;
//   try {
//     const files = fs.readdirSync(dir);
//     // files object contains all files names
//     // log them on console
//     files.forEach((file) => {
//       if (file.includes(req.query.filename)) {
//         check = true;
//         res.sendFile(__dirname + `/public/${file}`);
//       }
//     });
//     if (!check) res.send("no photos found");
//   } catch (err) {
//     console.log(err);
//   }
// });

// app.post("/api/upload", function (req, res) {
//   if (!req.files) {
//     return res.status(500).send({ msg: "file is not found" });
//   }
//   // accessing the file
//   const myFile = req.files.file; //  mv() method places the file inside public directory
//   myFile.mv(
//     `${__dirname}/public/${req.body.photoname}-${myFile.name}`,
//     function (err) {
//       if (err) {
//         console.log(err);
//         return res.status(500).send({ msg: "Error occured" });
//       }
//       // returing the response with file path and name
//       return res.send({ name: myFile.name, path: `/${req.body.photoname}` });
//     }
//   );
// });

app.post("/api/insert", (req, res) => {
  var node = req.body.input;
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
        "INSERT INTO `familymembers` (`id`,`pid`, `generation`, `name`, `birthdate`, `parent`, `partner`, `isPartner`) VALUES (?,?,?,?,?,?,?,?);";
      db.query(
        sqlInsert,
        [
          node.id,
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

      let method = "create";
      let changes = `${node.name}`;

      //write to edit history
      const sqlInsertHistory =
        "INSERT INTO `edithistory` (`time`, `author`, `changes`, `method`,`name`) VALUES (now(),?,?,?,?);";
      db.query(
        sqlInsertHistory,
        [req.body.author, changes, method, node.name],
        (err, result) => {
          console.log(err);
          console.log(result);
        }
      );
    }

    const sqldeleteold =
      "delete from `edithistory` where `time` < now() - interval 30 DAY;";
    db.query(sqldeleteold, (err, result) => {
      console.log(err);
      console.log(result);
    });
  });

  res.end();
});

app.post("/api/delete", (req, res) => {
  const id = req.body.id;
  console.log(id);
  let sqlDelete = "DELETE  FROM `familymembers` WHERE id = ?";
  db.query(sqlDelete, [id], (err, result) => {
    console.log(err);
    console.log(result);

    //update children
    let sqlUpdateChild =
      "UPDATE `familymembers` SET pid = 0, parent = null, isPartner = 0, partner = null WHERE pid = ?";
    db.query(sqlUpdateChild, [id], (err, result) => {
      console.log(err);
      console.log(result);
    });
    res.end();
  });

  //write to edit history
  const sqlInsertHistory =
    "INSERT INTO `edithistory` (`id`,`time`, `author`, `method`,`name`) VALUES (?,now(),?,?,?);";
  db.query(sqlInsertHistory, [id, req.body.author, "delete", req.body.name], (err, result) => {
    console.log(err);
    console.log(result);
  });
});

app.post("/api/delete/image", (req, res) => {
  let sqlFind = "SELECT photo_id FROM extradetails WHERE id=?";
  let photo_id_string;
  db.query(sqlFind, [req.body.id], (err, result) => {
    console.log(err);
    console.log(result);
    //remove public id from front end from list
    photo_id_string = result[0].photo_id
      .split(",")
      .filter((x) => x !== req.body.public_id)
      .join();
    let sqlUpdate = "UPDATE `extradetails` SET photo_id = ? WHERE id = ?;";
    db.query(sqlUpdate, [photo_id_string, req.body.id], (res) => {
      console.log(res);
    });
    res.end();
  });

  cloudinary.uploader.destroy(req.body.public_id);

  //write to edit history
  const sqlInsertHistory =
    "INSERT INTO `edithistory` (`id`,`time`, `author`,`changes`, `method`, `name`) VALUES (?,now(),?,?,?,?);";
  db.query(
    sqlInsertHistory,
    [req.body.id, req.body.author, "removed image", "deleted image", req.body.name],
    (err, result) => {
      console.log(err);
      console.log(result);
    }
  );
});

app.post("/api/update", (req, res) => {
  let node = req.body;
  console.log(node);
  let sqlUpdate =
    "UPDATE `familymembers` SET generation = ?, name = ?, birthdate = ?, deathdate = ?, pid = ?, isPartner = ?, parent = ?, partner = ? WHERE id = ?";

  //invisible root node is uneditable
  if (node.id !== 0) {
    db.query(
      sqlUpdate,
      [
        node.input.generation,
        node.input.name,
        node.input.birthdate,
        node.input.deathdate,
        node.input.pid,
        node.input.isPartner,
        node.input.parent,
        node.input.partner,
        node.input.id,
      ],
      (err, result) => {
        console.log(err);
        console.log(result);

        let method = "edit";
        //write to edit history
        const sqlInsertHistory =
          "INSERT INTO `edithistory` (`id`, `time`, `author`, `changes`, `method`,`name`) VALUES (?,now(),?,?,?,?);";
        db.query(
          sqlInsertHistory,
          [node.input.id, node.author, node.changes, method,node.input.name],
          (err, result) => {
            console.log(err);
            console.log(result);
          }
        );

        res.end();
      }
    );
  }

  const sqldeleteold =
    "delete from `edithistory` where `time` < now() - interval 30 DAY;";
  db.query(sqldeleteold, (err, result) => {
    console.log(err);
    console.log(result);
  });
});

//update extra details
app.post("/api/updateextra", (req, res) => {
  let node = req.body;
  console.log(node);
  let sqlWrite =
    "INSERT INTO `extradetails` (`id`, `location`, `extranames`, `fblink`, `profession`, `description`, `birthplace`) VALUES (?,?,?,?,?,?,?);";
  //invisible root node is uneditable
  if (node.id !== 0) {
    db.query(
      sqlWrite,
      [
        node.id,
        node.input.extradetails.location,
        node.input.extradetails.extranames,
        node.input.extradetails.fblink,
        node.input.extradetails.profession,
        node.input.extradetails.description,
        node.input.extradetails.birthplace,
      ],
      (err, result) => {
        if (err !== null) {
          let sqlUpdate =
            "UPDATE `extradetails` SET location = ?, extranames = ?, fblink = ?, profession = ?, description = ?, birthplace = ? WHERE id = ?;";
          db.query(sqlUpdate, [
            node.input.extradetails.location,
            node.input.extradetails.extranames,
            node.input.extradetails.fblink,
            node.input.extradetails.profession,
            node.input.extradetails.description,
            node.input.extradetails.birthplace,
            node.id,
          ]);
        }
      }
    );

    let method = "editextra";
    //write to edit history
    const sqlInsertHistory =
      "INSERT INTO `edithistory` (`id`, `time`, `author`, `changes`, `method`,`name`) VALUES (?,now(),?,?,?,?);";
    db.query(
      sqlInsertHistory,
      [node.id, node.author, node.changes, method, node.name],
      (err, result) => {
        console.log(err);
        console.log(result);
      }
    );
  }
  res.end();
});

//upload photo_id to node
app.put("/api/updateextra", (req, res) => {
  let node = req.body;
  let sqlWrite = "INSERT INTO `extradetails` (`id`, `photo_id`) VALUES (?,?);";
  //invisible root node is uneditable
  if (node.id !== 0) {
    db.query(sqlWrite, [node.id, node.photo_id], (err, result) => {
      if (err !== null) {
        let sqlUpdate = "UPDATE `extradetails` SET photo_id = ? WHERE id = ?;";
        db.query(sqlUpdate, [node.photo_id, node.id]);
      }
    });

    let method = "addphoto";
    let changes = "added photo";
    //write to edit history
    const sqlInsertHistory =
      "INSERT INTO `edithistory` (`id`, `time`, `author`, `changes`, `method`,`name`) VALUES (?,now(),?,?,?,?);";
    db.query(
      sqlInsertHistory,
      [node.id, node.author, changes, method, node.name],
      (err, result) => {
        console.log(err);
        console.log(result);
      }
    );
  }
  res.end();
});

var port = process.env.PORT || 5000;
app.listen(port, function () {
  console.log("Listening on " + port);
});
