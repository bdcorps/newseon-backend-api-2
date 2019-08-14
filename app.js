var express = require("express");
var mongoose = require("mongoose");
var gridfs = require("gridfs-stream");
const fs = require("fs");
const request = require("request");

const multer = require("multer");
var cookieParser = require("cookie-parser");
let bodyParser = require("body-parser");
var crypto = require("crypto");
var path = require("path");
var cors = require("cors");
var cron = require("node-cron");
var pjson = require("./package.json");

var parseString = require("xml2js").parseString;
var http = require("http");
var unsplash = require("unsplash-api");

require("dotenv").config();

var contentURLLists = require("./public/contentURLList");
var sampleArticle = require("./public/sampleArticle");

var playlistImagesSources = require("./public/playlistImageSources");
const trackRoute = express.Router();
const { Readable } = require("stream");

const mongodb = require("mongodb");
const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;

var models = require("./models/models.js");
var Article = models.ArticleModel;
var Playlist = models.PlaylistModel;
var Category = models.CategoryModel;
var Config = models.ConfigModel;

//put the key in .env
var NEWS_API_KEY = process.env.NEWS_API_KEY;
var GOOGLE_TRANSLATE_KEY = process.env.GOOGLE_TRANSLATE_KEY;
var UNSPLASH_ACCESS_ID = process.env.UNSPLASH_ACCESS_ID;

// Imports the Google Cloud client library
const textToSpeech = require("@google-cloud/text-to-speech");
var googleTranslate = require("google-translate")(GOOGLE_TRANSLATE_KEY);
// const { Translate } = require("@google-cloud/translate");

var currentPlaylistURLsToDownload = [];

unsplash.init(UNSPLASH_ACCESS_ID);

var dataToWriteToFile = { playlists: [] };

//var statusReport = {};

/* 
This API takes the queries in contentURLList.js and runs it through newsapi.org. The retrieved articles are then sent to Google Text to Speech. The audio is saved as filename, based on the hashed function (title of the article), in order to identify duplicates. The file is then uploaded to tracks db using GridFS and the location stored in the articles db.
*/

// async function detectLanguage(text) {
//   // Creates a client
//   const translate = new Translate();

//   /**
//    * TODO(developer): Uncomment the following line before running the sample.
//    */
//   // const text = 'The text for which to detect language, e.g. Hello, world!';

//   // Detects the language. "text" can be a string for detecting the language of
//   // a single piece of text, or an array of strings for detecting the languages
//   // of multiple texts.
//   let [detections] = await translate.detect(text);
//   detections = Array.isArray(detections) ? detections : [detections];
//   console.log("Detections:");
//   detections.forEach(detection => {
//     console.log(`${detection.input} => ${detection.language}`);
//   });
// }

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

// Add headers
app.use(function(req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

const HTTP_SERVER_ERROR = 500;
app.use(function(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  return res.status(err.status || HTTP_SERVER_ERROR).render("500");
});

/**
 * Connect MongoDriver to store the audio tracks
 */
let db;
MongoClient.connect(
  "mongodb://newseumapp1:newseumapp1@ds117336.mlab.com:17336/newseumapp",
  (err, database) => {
    if (err) {
      console.log(
        "MongoDB Connection Error. Please make sure that MongoDB is running."
      );

      //  statusReport.trackdb = {"err" :  JSON.stringify(err)}
      process.exit(1);
    }
    db = database;
    // statusReport.trackdb = {"status" :  "connected"}
  }
);

var connection = mongoose.connection;
connection.on("error", console.error.bind(console, "connection error:"));

/**
 * Connect Mongoose to store Article documents
 */
mongoose.connect(
  "mongodb://newseumapp1:newseumapp1@ds117336.mlab.com:17336/newseumapp"
);

mongoose.Promise = Promise;

//----------------------google text to speech

var credentials = JSON.parse(process.env.GOOGLE_TTS_KEY);

// Creates a client
const client = new textToSpeech.TextToSpeechClient({
  credentials: credentials
});

connection.once("open", function() {
  //  statusReport.articledb = {"status" :  "connected"}

  // app.get("/categories", (req, res) => {
  //   Category.find({}, function(err, doc) {
  //     if (err) {
  //       res.send("error: " + err);
  //     }
  //     res.send({ category: doc[0] });
  //   });
  // });

  Config.find({}, function(err, doc) {
    if (err) {
      res.send("error: " + err);
    }

    if (doc != null && doc.length > 0) {
      writeToFile({ categories: doc[0].categories }, "categoriesConfig");
      writeToFile({ articles: doc[0].articles }, "articlesData");
    }
  });

  function xmlToJson(url, callback) {
    var req = http.get(url, function(res) {
      var xml = "";

      res.on("data", function(chunk) {
        xml += chunk;
      });

      res.on("error", function(e) {
        callback(e, null);
      });

      res.on("timeout", function(e) {
        callback(e, null);
      });

      res.on("end", function() {
        parseString(xml, function(err, result) {
          callback(null, result);
        });
      });
    });
  }

  app.get("/dashboard", (req, res) => {
    res.render("main.ejs");
  });

  app.get("/dashboard2", (req, res) => {
    res.render("dashboard.ejs");
  });

  app.get("/articles", (req, res) => {
    var articles = readFromFile(__dirname + "/public/articlesData");
    articles = articles;

    res.render("articles.ejs", {
      articles: articles,
      status: ""
    });
  });

  app.get("/categories", (req, res) => {
    var categories = readFromFile(__dirname + "/public/categoriesConfig");
    categories = categories;

    res.render("categories.ejs", {
      categories: categories,
      status: ""
    });
  });

  var c = 0;
  app.post("/saveCategories", (req, res) => {
    c++;
    var categories = req.body.categories;
    writeToFile({ categories: categories }, "categoriesConfig");

    Config.findOneAndUpdate(
      {},
      { categories: categories },
      { upsert: true },
      function(err, doc) {
        if (err) {
          console.error("ERROR! Config Categories ID is " + " " + err);
        }
      }
    );

    var categories = readFromFile(__dirname + "/public/categoriesConfig");

    res.render("categories.ejs", {
      categories: categories,
      status: "Categories Saved!"
    });
  });

  app.post("/saveArticles", (req, res) => {
    var articles = req.body.articles;
    writeToFile({ articles: articles }, "articlesData");

    Config.findOneAndUpdate(
      {},
      { articles: articles },
      { upsert: true },
      function(err, doc) {
        if (err) {
          console.error("ERROR! Config articles ID is " + " " + err);
        }
      }
    );

    res.render("articles.ejs", {
      articles: articles,
      status: "Articles Saved!"
    });
  });

  app.get("/db/categories/:categoryID", (req, res) => {
    Category.find({ id: req.params.categoryID }, function(err, doc) {
      if (err) {
        res.send("error: " + err);
      }
      res.send(doc[0]);
    });
  });

  app.get("/db/playlists/:playlistID", (req, res) => {
    Playlist.find({ id: req.params.playlistID }, function(err, doc) {
      if (err) {
        res.send("error: " + err);
      }
      res.send(doc[0]);
    });
  });

  app.get("/db/articles/:articleID", (req, res) => {
    Article.find({ uid: req.params.articleID }, function(err, doc) {
      if (err) {
        res.send("error: " + err);
      }
      res.send(doc[0]);
    });
  });

  /*
   *
   *
   */
  app.get("/generatev2", (req, res) => {
    categoriesAPI = [];

    var categories = readFromFile(__dirname + "/public/categoriesConfig");
    categories = categories.categories;

    for (var i = 0; i < categories.length; i++) {
      var categoriesData = {};
      var category = categories[i];
      categoriesData.id = category.id;
      categoriesData.title = category.title;
      categoriesData.playlists = convertQueryToPlaylistURLs(
        category.playlists,
        category.title
      );
      categoriesAPI.push(categoriesData);

      var categoryToSave = new Category({
        id: categoriesData.id,
        title: categoriesData.title,
        playlists: categoriesData.playlists
      });

      categoryToSave.save(function(error) {
        if (error) {
          console.error(error);
        }
      });
    }

    dataToWriteToFile = { playlists: [] };

    res.send("Generated");
  });

  function convertQueryToPlaylistURLs(playlistQuery, title) {
    var playlistIDs = [];
    var title;
    var urls = [];
    var playlistsAPI = [];
    for (var i = 0; i < playlistQuery.length; i++) {
      var curPlaylist = playlistQuery[i];
      var query = curPlaylist.query;

      if (curPlaylist.type == "everything") {
        title = "Daily News";
        let urlParameters = Object.entries(query)
          .map(e => e.join("="))
          .join("&");
        var playlistURL =
          "https://newsapi.org/v2/everything?" +
          urlParameters +
          "&apiKey=" +
          NEWS_API_KEY;

        urls.push(playlistURL);
      }

      var random =
        Math.random()
          .toString(36)
          .substring(2, 15) +
        Math.random()
          .toString(36)
          .substring(2, 15);

      var playlistsData = {};
      playlistsData.id = random;
      if (query.category != null) {
        playlistsData.category = query.category;
      } else if (query.q != null) {
        //playlistsData.title = title + " about " + captilizeWord(query.q);
        playlistsData.category = query.q;
      }
      playlistsData.title = captilizeWord(curPlaylist.title);
      //console.log(" > "+ captilizeWord(query.title));
      playlistsData.url = playlistURL;
      playlistsData.media = playlistImagesSources.getPlaylistSplashMedia();
      playlistsData.articles = [];
      playlistIDs.push({
        id: playlistsData.id,
        title: playlistsData.title,
        media: playlistsData.media
      });

      dataToWriteToFile.playlists.push({
        id: playlistsData.id,
        url: playlistsData.url,
        category: playlistsData.category
      });
      writeToFile(dataToWriteToFile, "playlistsData");

      //playlistsAPI.push(playlistsData);

      //Put playlistsData to playlistdb

      //TODO: need to add actual articles
      var playlistToSave = new Playlist({
        id: playlistsData.id,
        title: playlistsData.title,
        url: playlistsData.url,
        media: playlistsData.media,
        category: playlistsData.category,
        articles: playlistsData.articles
      });

      playlistToSave.save(function(error) {
        if (error) {
          console.error(error);
        }
      });
    }
    //return playlists ids
    return playlistIDs;
  }

  function resetDB() {
    Article.remove({}, function(err) {
      if (err) {
        console.log("error");
      }
    });
    Playlist.remove({}, function(err) {
      if (err) {
        console.log("error");
      }
    });

    Category.remove({}, function(err) {
      if (err) {
        console.log("error");
      }
    });

    Config.remove({}, function(err) {
      if (err) {
        console.log("error");
      }
    });

    //delete tracks tracks files and chunks
    var bucket = new mongodb.GridFSBucket(db, { bucketName: "tracks" });
    var CHUNKS_COLL = "tracks.chunks";
    var FILES_COLL = "tracks.files";

    bucket.drop(function(error) {
      var chunksQuery = db.collection(CHUNKS_COLL).find({});
      chunksQuery.toArray(function(error, docs) {
        if (error != null && docs.length > 0) {
          var filesQuery = db.collection(FILES_COLL).find({});
          filesQuery.toArray(function(error, docs) {});
        }
      });
    });
  }

  function writeToFile(data, fileName) {
    var dataToWrite = data;
    var d = new Date();
    var n = d.getTime();

    dataToWrite.timestamp = n;
    fs.writeFileSync(
      __dirname + "/public/" + fileName,
      prettyPrintJSON(data),
      "utf8",
      err => {
        if (err) throw err;

        console.log(fileName + " file saved");
      }
    );
  }
  function readFromFile(path) {
    var text = fs.readFileSync(path, "utf8");
    return JSON.parse(text);
  }

  function captilizeWord(lower) {
    return lower.charAt(0).toUpperCase() + lower.substr(1);
  }

  app.get("/", (req, res) => {
    res.render("index.ejs", {
      version: pjson.version
    });
  });

  app.get("/resetv2", (req, res) => {
    resetDB();
    res.send("Reset DB");
  });

  app.get("/tracksv2", (req, res) => {
    generateAudioTracks(req, res);
    res.send("Tracks written");
  });
  /**
   * GET /tracks/:trackID
   */
  app.get("/tracks/:trackID", (req, res) => {
    try {
      var trackID = new ObjectID(req.params.trackID);
    } catch (err) {
      return res.status(400).json({
        message:
          "Invalid trackID in URL parameter. Must be a single String of 12 bytes or a string of 24 hex characters"
      });
    }
    res.set("content-type", "audio/mp3");
    res.set("accept-ranges", "bytes");

    let bucket = new mongodb.GridFSBucket(db, {
      bucketName: "tracks"
    });

    let downloadStream = bucket.openDownloadStream(trackID);

    downloadStream.on("data", chunk => {
      res.write(chunk);
    });

    downloadStream.on("error", () => {
      res.sendStatus(404);
    });

    downloadStream.on("end", () => {
      res.end();
    });
  });

  /**
   * POST /tracks
   */

  app.get("/writesv2", (req, res) => {
    //read playlistsData file

    var data = readFromFile(__dirname + "/public/playlistsData");
    var playlists = data.playlists;

    var articleCollection = [];

    //Calls the newsapi.org for articles based on the contentURLList.js

    //console.log(prettyPrintJSON(playlists));

    writeToFile("", "articlesData");

    // detectLanguage(
    //   "Novidades de The Last of Us 2 e Death Stranding, Gears 5 vai rodar em 4k e 60 fps - Daily Fix"
    // );

    for (let i = 0; i < playlists.length; i++) {
      request(playlists[i].url, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          let articles = JSON.parse(body).articles;

          for (let j = 0; j < articles.length; j++) {
            let options = {
              method: "POST",
              url: "https://ws.detectlanguage.com/0.2/detect",
              qs: { q: articles[j].title },
              headers: {
                "Postman-Token": "3c1a5108-ab0d-44bd-bded-9536845f98d3",
                "cache-control": "no-cache",
                Authorization: "Bearer 6b5cb08f342c6c38f3a3b49515787359"
              }
            };

            googleTranslate.detectLanguage(articles[j].title, function(
              err,
              detection
            ) {
              if (err) {
                console.log(
                  "Problem with Google Translate API. More Details. ",
                  err
                );
              }
              if (!err && detection.language == "en") {
                console.log("Is English: " + articles[j].title);
                articles[j].title = cleanedTitle(articles[j].title);
                articles[j].description = cleanedDescription(
                  articles[j].description
                );
                articles[j].playlist = { id: playlists[i].id };

                articleCollection.push(articles[j]);
                writeToFile({ articles: articleCollection }, "articlesData");
              } else {
                console.log("Not English: " + articles[j].title);
              }
            });
          }
        }
      });
    }

    return res.status(201).json({
      message: "File uploaded successfully."
    });
  });

  function generateAudioTracks(req, res) {
    var articles = readFromFile(__dirname + "/public/articlesData");
    articles = articles.articles;

    //console.log("about to write" + JSON.stringify(articles));

    articleIDs = [];
    // Create a hash based on the contents of the article title
    // This is so we don't write duplicate content to the db
    var hash = "";
    for (var j = 0; j < articles.length; j++) {
      hash = crypto
        .createHash("md5")
        .update(articles[j].title)
        .digest("hex");

      initAudioTracks(
        req,
        res,
        articles[j],
        hash,
        articles[j].playlist.id,
        j,
        articles[j].playlist.category
      );

      articleIDs.push(hash);
    }
  }
});

const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

// Slowing down the calls to Google Text to Speech
const initAudioTracks = async (
  req,
  res,
  article,
  hash,
  playlistID,
  articleOrder,
  category
) => {
  await snooze(5000);
  generateAudioTrack(
    req,
    res,
    article,
    hash,
    playlistID,
    articleOrder,
    category
  );
};

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fields: 1, fileSize: 6000000, files: 1, parts: 2 }
});

function generateAudioTrack(
  req,
  res,
  article,
  hash,
  playlistID,
  articleOrder,
  category
) {
  var cleanedAbstract =
    article.description != null ? article.description : article.title;

  const audioRequest = {
    input: {
      text: article.title + " " + article.description
    },
    // Select the language and SSML Voice Gender (optional)
    voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
    // Select the type of audio encoding
    audioConfig: { audioEncoding: "MP3" }
  };

  // Performs the Text-to-Speech request
  client.synthesizeSpeech(audioRequest, (err, response) => {
    if (err) {
      console.error("ERROR:", err);
      // statusReport.speech = {tts: JSON.stringify(err)};
      return;
    }

    //  statusReport.speech = {tts: "connected"};

    // Write the binary audio content to a local file
    fs.writeFile(
      __dirname + "/uploads/" + hash,
      response.audioContent,
      "binary",
      err => {
        if (err) {
          console.error("ERROR:", err);
          return;
        }

        //When done saving file
        //need req res context to save the tracks
        upload.single("track")(req, res, err => {
          if (err) {
            console.log("error: " + err);
          }
          uploadTrack(article, hash, playlistID, articleOrder, category);
        });
      }
    );
  });
}

function cleanText(inputText) {
  var cleanedText = inputText;
  cleanedText = cleanedText.replace(/&#.{4};|\[&#.{4};\]/g, "");
  return cleanedText;
}

function cleanedTitle(inputText) {
  var cleanedText = inputText;

  if (cleanedText[cleanedText.length - 1] == "?") {
  } else if (cleanedText[cleanedText.length - 1] != ".") {
    cleanedText += ".";
  }
  return cleanedText;
}

function cleanedDescription(inputText) {
  var cleanedText = inputText.replace('"', "'");
  cleanedText = cleanedText.replace(/<.>|<\/.>/g, "");
  return cleanedText;
}

// Uploads the audio track of the news article to db
function uploadTrack(article, hash, playlistID, articleOrder, category) {
  //console.log("upload track id is: " + playlistID);

  var readableTrackStream = fs.createReadStream(__dirname + "/uploads/" + hash);

  let bucket = new mongodb.GridFSBucket(db, {
    bucketName: "tracks"
  });

  let uploadStream = bucket.openUploadStream(hash);

  let id = uploadStream.id;

  readableTrackStream.pipe(uploadStream);

  uploadStream.on("error", () => {
    return res.status(500).json({ message: "Error uploading file" });
  });

  uploadStream.on("finish", () => {
    var articleObject = {
      uid: hash,
      order: articleOrder,
      headline: article.title,
      // abstract: article.description,
      abstract:
        article.description != null ? article.description : article.title,
      publisher: article.source.name != null ? article.source.name : "CNN",
      // media: article.urlToImage,
      media:
        article.urlToImage != null
          ? article.urlToImage
          : playlistImagesSources.getArticleSplashMedia(category),
      publishedOn:
        article.publishedAt != null
          ? new Date(article.publishedAt)
          : Date.now(),
      audioTrackID: id,
      url: article.url
    };

    //save to mongodb
    var articleToSave = new Article(articleObject);

    console.log("Generating track for: #" + articleObject.uid);
    //console.log(prettyPrintJSON(articleObject));

    articleToSave.save(function(error) {
      if (error) {
        console.error(error);
      }

      //save articleIDs to playlistdb docs
      Playlist.findOne({ id: playlistID }, function(err, doc) {
        if (doc != null) {
          doc.articles.push(articleObject);
          doc.save(function(err) {
            if (err) {
              console.error("ERROR! Playlist ID is " + id + " " + err);
            }
          });
        }
      });
    });
  });
}

var reloadContentAsync = async () => {
  request("http://newseon-backend-api-2.herokuapp.com/resetv2", function(
    error,
    response,
    body
  ) {
    console.log("error:", error);
    console.log("statusCode:", response && response.statusCode);
    console.log("body:", body);
  });
  await snooze(5000);
  console.log("Generating.");
  request("http://newseon-backend-api-2.herokuapp.com/generatev2", function(
    error,
    response,
    body
  ) {
    console.log("error:", error);
    console.log("statusCode:", response && response.statusCode);
    console.log("body:", body);
  });

  await snooze(5000);
  console.log("Writing.");
  request("http://newseon-backend-api-2.herokuapp.com/writesv2", function(
    error,
    response,
    body
  ) {
    console.log("error:", error);
    console.log("statusCode:", response && response.statusCode);
    console.log("body:", body);
  });

  await snooze(5000);
  console.log("Creating Tracks.");
  request("http://newseon-backend-api-2.herokuapp.com/tracksv2", function(
    error,
    response,
    body
  ) {
    console.log("error:", error);
    console.log("statusCode:", response && response.statusCode);
    console.log("body:", body);
  });
};

//Reload at 8:10 AM
var reloadContentCron = cron.schedule(
  "00 10 08 * * *",
  () => {
    console.log("Reloading content on " + Date.now());
    reloadContentAsync();
  },
  undefined,
  {
    scheduled: true,
    timezone: "America/New_York"
  }
);
console.log(Date.now());

reloadContentCron.start();

var port = process.env.PORT || process.env.VCAP_APP_PORT || 3005;

function prettyPrintJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

app.listen(port, function() {
  console.log("Server running on port: %d", port);
});
