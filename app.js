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

const logModule = require("./logger");
const logger = logModule.logger;

const {
  cleanText,
  cleanedDescription,
  writeToFile,
  readFromFile,
  captilizeSentence,
  prettyPrintJSON,
  xmlToJson,
  snooze
} = require("./utils/helpers");

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
  { useUnifiedTopology: true, useNewUrlParser: true },
  (err, client) => {
    if (err) {
      throw new Error(
        "MongoDB Connection Error. Please make sure that MongoDB is running."
      );
      process.exit(1);
    }
    db = client.db("newseumapp");
  }
);

var connection = mongoose.connection;
connection.on("error", console.error.bind(console, "connection error:"));

/**
 * Connect Mongoose to store Article documents
 */
mongoose.connect(
  "mongodb://newseumapp1:newseumapp1@ds117336.mlab.com:17336/newseumapp",
  { useUnifiedTopology: true, useNewUrlParser: true }
);

mongoose.Promise = Promise;

//----------------------google text to speech

var credentials = JSON.parse(process.env.GOOGLE_TTS_KEY);

// Creates a client
const client = new textToSpeech.TextToSpeechClient({
  credentials: credentials
});

connection.once("open", function() {
  /*Write server data - articles and categories to local storage
   */
  Config.find({}, function(err, doc) {
    if (err) {
      throw new Error("Cannot get Config object", err);
    }

    if (doc != null && doc.length > 0) {
      writeToFile({ categories: doc[0].categories }, "categoriesConfig");
      writeToFile({ articles: doc[0].articles }, "articlesData");
    }
  });

  app.get("/", (req, res) => {
    res.render("index.ejs", {
      version: pjson.version
    });
  });

  app.get("/dashboard", (req, res) => {
    res.render("main.ejs");
  });

  // Render Instagram post
  app.get("/render", (req, res) => {
    res.render("renderInstagram.ejs");
  });

  app.get("/resetv2", (req, res) => {
    resetDB();
    res.send("Reset DB");
  });

  app.get("/readLocalArticles", (req, res) => {
    var articles = readFromFile("articlesData");

    res.render("articles.ejs", {
      articles: articles,
      status: ""
    });
  });

  app.post("/saveLocalArticles", (req, res) => {
    if (req.body.articles == undefined) {
      throw new Error("Object articles not found", err);
    }
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

  app.get("/readLocalCategories", (req, res) => {
    var categories = readFromFile("categoriesConfig");

    res.render("categories.ejs", {
      categories: categories,
      status: ""
    });
  });

  app.post("/saveLocalCategories", (req, res) => {
    if (req.body.categories == undefined) {
      throw new Error("Object categories not found", err);
    }
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

    var categories = readFromFile("categoriesConfig");

    res.render("categories.ejs", {
      categories: categories,
      status: "Categories Saved!"
    });
  });

  app.get("/generatev2", (req, res) => {
    categoriesAPI = [];

    var categories = readFromFile("categoriesConfig");
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

  app.get("/tracksv2", (req, res) => {
    generateAudioTracks(req, res);
    res.send("Tracks written");
  });

  app.get("/writesv2", (req, res) => {
    var data = readFromFile("playlistsData");
    var playlists = data.playlists;

    var articleCollection = [];

    //Calls the newsapi.org for articles based on the contentURLList.js

    //console.log(prettyPrintJSON(playlists));

    writeToFile("", "articlesData");

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

            var isValid = validateArticle(articles[j]);
            if (isValid) {
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
                  articles[j].title = cleanText(articles[j].title);
                  articles[j].description = cleanedDescription(
                    articles[j].description
                  );
                  console.log("title --. ", playlists[i].title);
                  articles[j].playlist = {
                    id: playlists[i].id,
                    title: playlists[i].title
                  };

                  articleCollection.push(articles[j]);
                  writeToFile({ articles: articleCollection }, "articlesData");
                } else {
                  console.log("Not English: " + articles[j].title);
                }
              });
            } else {
              console.log(
                "Article was not valid",
                JSON.stringify(article[j], null, 2)
              );
            }
          }
        }
      });
    }

    return res.status(201).json({
      message: "File uploaded successfully."
    });
  });

  /**
   * GET /db/tracks/:trackID
   */
  app.get("/db/tracks/:trackID", (req, res) => {
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
});

function isValid(article) {
  return (
    thisSession.hasOwnProperty("source") &&
    thisSession.hasOwnProperty("author") &&
    thisSession.hasOwnProperty("title") &&
    thisSession.hasOwnProperty("description") &&
    thisSession.hasOwnProperty("url") &&
    thisSession.hasOwnProperty("publishedAt")
  );
}

function generateAudioTracks(req, res) {
  var articles = readFromFile("articlesData");
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
      articles[j].playlist.title
    );

    articleIDs.push(hash);
  }
}
// Slowing down the calls to Google Text to Speech
const initAudioTracks = async (
  req,
  res,
  article,
  hash,
  playlistID,
  articleOrder,
  playlistTitle
) => {
  await snooze(5000);
  generateSingleAudioTrack(
    req,
    res,
    article,
    hash,
    playlistID,
    articleOrder,
    playlistTitle
  );
};

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fields: 1, fileSize: 6000000, files: 1, parts: 2 }
});

function generateSingleAudioTrack(
  req,
  res,
  article,
  hash,
  playlistID,
  articleOrder,
  playlistTitle
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
          uploadTrackToDB(
            article,
            hash,
            playlistID,
            articleOrder,
            playlistTitle
          );
        });
      }
    );
  });
}

function convertQueryToPlaylistURLs(playlistQuery, title) {
  console.log("query -->", playlistQuery);
  var playlistIDs = [];
  var title;
  var urls = [];
  var playlistsAPI = [];
  for (var i = 0; i < playlistQuery.length; i++) {
    var curPlaylist = playlistQuery[i];
    var query = curPlaylist.query;
    var playlistURL = "";
    if (curPlaylist.type == "everything") {
      title = "Daily News";
      let urlParameters = Object.entries(query)
        .map(e => e.join("="))
        .join("&");
      playlistURL =
        "https://newsapi.org/v2/everything?" +
        urlParameters +
        "&apiKey=" +
        NEWS_API_KEY;

      // urls.push(playlistURL);
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
    // if (query.category != null) {
    //   playlistsData.category = query.category;
    // } else if (query.q != null) {
    //   //playlistsData.title = title + " about " + captilizeWord(query.q);
    //   playlistsData.category = query.q;
    // }
    playlistsData.title = captilizeSentence(curPlaylist.title);
    //console.log(" > "+ captilizeWord(query.title));
    playlistsData.url = playlistURL;
    playlistsData.media = playlistImagesSources.getPlaylistSplashMedia();
    playlistsData.articles = [];

    var playlistItem = {
      id: playlistsData.id,
      url: playlistsData.url,
      title: playlistsData.title,
      media: playlistsData.media
    };
    playlistIDs.push(playlistItem);

    dataToWriteToFile.playlists.push(playlistItem);
    writeToFile(dataToWriteToFile, "playlistsData");

    //playlistsAPI.push(playlistsData);

    //Put playlistsData to playlistdb

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

  console.log("resposne -->", playlistIDs);
  //return playlists ids
  return playlistIDs;
}

// Uploads the audio track of the news article to db
function uploadTrackToDB(
  article,
  hash,
  playlistID,
  articleOrder,
  playlistTitle
) {
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
          : playlistImagesSources.getArticleSplashMedia(playlistTitle),
      publishedOn:
        article.publishedAt != null
          ? new Date(article.publishedAt)
          : Date.now(),
      audioTrackID: id,
      url: article.url
    };

    //save to mongodb
    var articleToSave = new Article(articleObject);

    console.log(
      "Generating track for playlist with title",
      playlistTitle,
      "for article #",
      articleObject.uid
    );
    console.log(prettyPrintJSON(articleObject));

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

var port = process.env.PORT || process.env.VCAP_APP_PORT || 3005;

app.listen(port, function() {
  // logger.info("Hs");
  console.log("Server running on port: %d", port);
});

module.exports = {
  convertQueryToPlaylistURLs: convertQueryToPlaylistURLs
};
