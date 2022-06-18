/*
@author: Esteban Castro Rojas
@created: 2022-06-18

- Formatting provided by Prettier
- Sources: 
  https://zellwk.com/blog/crud-express-mongodb/
  https://www.mongodb.com/docs/manual/reference/method/db.collection.updateOne/
  https://www.mongodb.com/docs/manual/tutorial/remove-documents/
  https://nodejs.org/api/process.html
*/

const express = require("express");
const console = require("console");
const os = require("os");

// Constants
const hostname = "0.0.0.0";
const port = 8080;

// App
const app = express();
app.use(express.json());

// General purpose
const hostName = os.hostname();

// GET method route
app.get("/", function (req, res) {
  res.send("👽");
});

// // POST method route
// app.post('/', function (req, res) {
//     res.send('POST request to the homepage');
// });

// // GET method route
// app.get('/secret', function (req, res, next) {
//     res.send('Never be cruel, never be cowardly. And never eat pears!');
//     console.log('This is a console.log message.');
// });

/*
Your implementation here 
*/

// // Connect to mongodb server
const MongoClient = require("mongodb").MongoClient;
// /* Your url connection to mongodb container */
const url = "mongodb://localhost:27017/";

MongoClient.connect(url, (err, client) => {
  // original source : https://zellwk.com/blog/crud-express-mongodb/
  if (err) return console.error(err);
  console.log("Connected to Database");
  const db = client.db("220531770_61_bootcamp");
  const bc = db.collection("bootcamp");

  // GET method route
  // Retrieve all documents in collection
  app.get("/all", (req, res) => {
    bc.find({})
      .toArray()
      .then((arr) => {
        console.log("found: " + JSON.stringify(arr));
        res.json(arr);
      })
      .catch((error) =>
        res.status(400).json({ status: "NOK", message: error.message })
      );
  });

  // GET method route
  // Query by hostname
  app.get("/one", (req, res) => {
    bc.find({ hostname: req.query.hostname })
      .toArray()
      .then((arr) => {
        res.json(arr);
      })
      .catch((error) =>
        res.status(400).json({ status: "NOK", message: error.message })
      );
  });

  /* PUT method. Modifying the message based on host. 
    If not found, create a new document in the database. (201 Created)
    If found, message, date and offset is modified (200 OK) */
  app.put("/one", async (req, res) => {
    // source: https://www.mongodb.com/docs/manual/reference/method/db.collection.updateOne/
    try {
      // if (!req.body || !req.body.hostname) throw {message: "Incorrect Body"};
      const hostname = req.body.hostname ? req.body.hostname : hostName;

      let status = 200;

      const result = await bc.updateOne(
        {
          hostname: hostname,
        },
        {
          $set: {
            name: req.body.name,
            vehicle: req.body.vehicle,
            hostname: hostname,
          },
          $inc: {
            updates: 1
          }
        },
        { upsert: true }
      );

      if (result && result.matchedCount == 0 && result.upsertedCount > 0) {
        status = 201;
      }

      res.status(status).json({ status: "OK", id: result.upsertedId });
    } catch (error) {
      res.status(400).json({ status: "NOK", message: error.message });
    }
  });

  /* DELETE method. Modifying the message based on hostname. 
    If not found, do nothing. (204 No Content)
    If found, document deleted (200 OK) */
  app.delete("/one", (req, res) => {
    // source: https://www.mongodb.com/docs/manual/tutorial/remove-documents/
    bc.deleteOne({
      hostname: req.query.hostname,
    })
      .then((result) => {
        res.json({ status: "OK", id: result.insertedId });
      })
      .catch((error) =>
        res.status(204).json({ status: "NOK", message: error.message })
      );
  });

  // Using a single function to handle multiple signals
  // source: https://nodejs.org/api/process.html
  function handle(signal) {
    console.log(`\nReceived ${signal}. Closing connections.`);
    client.close().then(() => {
      console.log(`DB client connection closed.`);
      process.exit(0);
    });
  }

  process.on("SIGINT", handle); // Ctrl-C
  process.on("SIGTERM", handle); // not supported on Windows
  process.on("SIGHUP", handle); // 'SIGHUP' is generated on Windows when the console window is closed.
});

app.listen(port, hostname);
console.log(`Running on http://${hostname}:${port}`);
