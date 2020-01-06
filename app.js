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
var stringSimilarity = require("string-similarity");

const logModule = require("./logger");
const logger = logModule.logger;

// const { reloadContentAsync } = require("./reload");

const {
  cleanText,
  cleanedDescription,
  writeToFile,
  readFromFile,
  captilizeSentence,
  prettyPrintJSON,
  xmlToJson,
  validateArticleStructure,
  snooze,
  generateRandomID
} = require("./utils/helpers");

const {
  MISSING_PLAYLIST_QUERY,
  MISSING_PLAYLIST_TYPE,
  MISSING_PLAYLIST
} = require("./utils/consts");

var CHUNKS_COLL = "tracks.chunks";
var FILES_COLL = "tracks.files";

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
var User = models.UserModel;

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
  { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false }
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

  app.get("/resetv2", async (req, res) => {
    var bucket = new mongodb.GridFSBucket(db, { bucketName: "tracks" });

    resetDB(bucket)
      .then(data => {
        console.log("sad");
      })
      .catch(err => console.log("pra pa ", err, "pa"));

    res.send("Reset DB");
  });

  app.get("/readLocalArticles", (req, res) => {
    var articles = readFromFile("articlesData");

    // console.log("lemme", JSON.stringify(articles, null, 4));

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
      try {
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
      } catch (e) {
        
        console.error(e);
      }
    }

    dataToWriteToFile = { playlists: [] };

    res.send("Generated");
  });

  app.get("/writesv2", async (req, res) => {
    var data = readFromFile("playlistsData");
    var playlists = data.playlists;

    var articleCollection = [];

    //Calls the newsapi.org for articles based on the contentURLList.js
    //console.log(prettyPrintJSON(playlists));

    writeToFile("", "articlesData");

    for (let i = 0; i < playlists.length; i++) {
      request(playlists[i].url, async function(error, response, body) {
        if (!error && response.statusCode == 200) {
          let articles = JSON.parse(body).articles;

          for (let j = 0; j < articles.length; j++) {
            var isValidText = validateArticleStructure(articles[j]);
            var title = articles[j].title;
            var description = articles[j].description;
            var content = "";

            if (isValidText) {
              if (await isGenuineArticle(title, description)) {
                articles[j].title = cleanText(title);
                articles[j].description = cleanedDescription(description);
                articles[j].content = cleanText(content);
                articles[j].playlist = {
                  id: playlists[i].id,
                  title: playlists[i].title
                };

                articleCollection.push(articles[j]);
                console.dir("writing articles data ", articleCollection[0]);
                writeToFile({ articles: articleCollection }, "articlesData");
              } else {
                console.log("Not genuine " + articles[j].title);
              }
            } else {
              console.log(
                "Article was not valid",
                JSON.stringify(articles[j], null, 2)
              );
            }
          }
        }
      });
    }

    res.send("Writes DB");
  });

  app.get("/tracksv2", (req, res) => {
    generateAudioTracks(req, res);
    res.send("Tracks written");
  });

  app.get("/reloadv2", async (req, res) => {
    // await reloadContentAsync();
    res.send("Reload");
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

  // app.get("/user/save", (req, res) => {
  //   const user = req.params.user;

  //   const userToSave = new User({
  //     id: user.id,
  //     name: user.name,
  //     email: user.email,
  //     profilePhoto: user.photo
  //   });

  //   userToSave.save(function(error) {
  //     if (error) {
  //       console.error(error);
  //     }
  //   });
  // });

  app.post("/user", (req, res) => {
    var user = req.body;

    console.log(user);
    const userToSave = {
      id: user.id,
      name: user.name,
      email: user.email,
      profilePhoto: user.photo
    };

    User.findOneAndUpdate(
      { id: user.id },
      userToSave,
      { new: true, upsert: true },
      function(err, doc) {
        if (err) return res.send(500, { error: err });
        console.log("resoisbn", JSON.stringify(doc));
        return res.send({ user: JSON.stringify(doc) });
      }
    );
  });

  // app.get("/user/get", (req, res) => {
  //   const id = req.params.id;

  //   User.find({ id: id }, function(err, doc) {
  //     if (err) {
  //       res.send("error: " + err);
  //     }
  //     res.send(doc[0]);
  //   });
  // });
});

/* Remove Headline if title === description or if either contains the word, "cheap $ tips week guide highlights"
 *
 */
async function isGenuineArticle(title, description) {
  const dirtyWords = [
    "$",
    "tips",
    "guide",
    "week",
    "highlights",
    "roundup",
    "video",
    "news",
    "deals",
    "discounts"
  ];
  const normalizedTitle = title.toLowerCase();
  const normalizedDescription = description.toLowerCase();

  var similarity = stringSimilarity.compareTwoStrings(
    normalizedTitle,
    normalizedDescription
  );

  if (similarity > 0.75) {
    console.log(
      "isGenuineArticle false {sameArticleAndDescription} because ",
      normalizedTitle
    );
    return false;
  }

  const isArticleDirty = dirtyWords.every(
    dirtyWord =>
      !normalizedTitle.includes(dirtyWord) &&
      !normalizedDescription.includes(dirtyWord)
  );

  if (!isArticleDirty) {
    console.log(
      "isGenuineArticle false {articleContainsDirtyWords} because ",
      normalizedTitle
    );
    return false;
  }

  let isInEnglish1;
  try {
    isInEnglish1 = await isInEnglish(normalizedTitle);
  } catch (error) {
    console.error("pa ", error, "pra");
    return false;
  }
  return isInEnglish1;
}

// const a = isInEnglish("Bonne après-midi");
// console.log(a);

function isInEnglish(text) {
  let promise = new Promise(function(resolve, reject) {
    googleTranslate.detectLanguage(text, function(err, detection) {
      if (err) {
        console.log("Problem with Google Translate API. More Details. ", err);
        return false;
      }

      if (!err && detection.language == "en") {
        console.log("Is English: " + text);
        resolve(true);
      } else {
        console.log("Not English: " + text);
        reject(new Error("Invalid Language"));
        return false;
      }
    });
  });
  return promise;
}

let listArticles = [];

function generateAudioTracks(req, res) {
  var articles = readFromFile("articlesData");
  articles = articles.articles;
  console.log("reading articles data ");
  console.dir(articles[0]);
  console.log("========reading articles data ");

  //console.log("about to write" + JSON.stringify(articles));

  articleIDs = [];
  // Create a hash based on the contents of the article title
  // This is so we don't write duplicate content to the db
  let hash = "";
  for (let j = 0; j < articles.length; j++) {
    hash = crypto
      .createHash("md5")
      .update(articles[j].title)
      .digest("hex");

    if (listArticles.indexOf(hash) == -1) {
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
      listArticles.push(hash);
      console.log("Not Duplicate", hash);
    } else {
      console.log("Duplicate Found", hash);
    }
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

var voiceGender = ["MALE", "FEMALE", "NEUTRAL"];
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
    voice: {
      languageCode: "en-US",
      ssmlGender: voiceGender[Math.floor(Math.random() * voiceGender.length)]
    },
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

function validatePlaylistStructure(curPlaylist) {
  // if (!curPlaylist) {
  //   throw new Error(MISSING_PLAYLIST);
  // }
  // if (!curPlaylist.hasOwnProperty("query")) {
  //   throw new Error(MISSING_PLAYLIST_QUERY);
  // }
  // if (!curPlaylist.hasOwnProperty("type")) {
  //   throw new Error(MISSING_PLAYLIST_TYPE);
  // }

  return (
    curPlaylist.hasOwnProperty("query") &&
    !!curPlaylist["query"] &&
    curPlaylist.hasOwnProperty("type") &&
    !!curPlaylist["type"]
  );
}

function convertQueryToPlaylistURLs(playlistQuery, title) {
  var playlistIDs = [];
  var title;
  var urls = [];
  var playlistsAPI = [];
  for (var i = 0; i < playlistQuery.length; i++) {
    var curPlaylist = playlistQuery[i];

    var isValid = validatePlaylistStructure(curPlaylist);

    if (!isValid) {
      throw new Error(MISSING_PLAYLIST);
    }

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

    var playlistsData = {};
    // playlistsData.id = random;
    playlistsData.id = curPlaylist.title.toLowerCase();

    // if (query.category != null) {
    //   playlistsData.category = query.category;
    // } else if (query.q != null) {
    //   //playlistsData.title = title + " about " + captilizeWord(query.q);
    //   playlistsData.category = query.q;
    // }
    playlistsData.title = captilizeSentence(curPlaylist.title);
    //console.log(" > "+ captilizeWord(query.title));
    playlistsData.url = playlistURL;
    playlistsData.media = playlistImagesSources.getPlaylistSplashMedia(
      playlistsData.title
    );
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

    savePlaylistToDB(playlistToSave);
  }

  //return playlists ids
  return playlistIDs;
}

function savePlaylistToDB(playlistToSave) {
  console.log("saved to playlist");
  playlistToSave.save(function(error) {
    if (error) {
      console.error(error);
    }
  });
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
    // console.log(prettyPrintJSON(articleObject));

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

function resetArticleDB() {
  let promise1 = new Promise(function(resolve, reject) {
    Article.remove({}, function(err) {
      if (err) {
        console.log("error");
        reject(new Error("Could not empty article db"));
      }
      resolve();
    });
  });
  return promise1;
}

function resetPlaylistDB() {
  let promise2 = new Promise(function(resolve, reject) {
    Playlist.remove({}, function(err) {
      if (err) {
        console.log("error");
        reject(new Error("Could not empty playlist db"));
      }
      resolve();
    });
  });
  return promise2;
}

function resetConfigDB() {
  let promise4 = new Promise(function(resolve, reject) {
    Config.remove({}, function(err) {
      if (err) {
        console.log("error");
        reject(new Error("Could not empty config db"));
      }
      resolve();
    });
  });
}

function resetTracksDB(tracksBucket) {
  let promise5 = new Promise(function(resolve, reject) {
    //delete tracks tracks files and chunks

    tracksBucket
      .drop()
      .then(function(error) {})
      .catch(function(error) {
        console.log("woo", error, "hoo");
        reject(new Error("tracks already empty"));
      })
      .finally(function() {
        resolve();
        var chunksQuery = db.collection(CHUNKS_COLL).find({});
        chunksQuery.toArray(function(error, docs) {
          if (error != null && docs.length > 0) {
            var filesQuery = db.collection(FILES_COLL).find({});
            filesQuery.toArray(function(error, docs) {});
            resolve();
          }
        });
      });
  });
}

function resetCategoryDB() {
  let promise3 = new Promise(function(resolve, reject) {
    Category.remove({}, function(err) {
      if (err) {
        console.log("error");
        reject(new Error("Could not empty category db"));
      }
      resolve();
    });
  });
  return promise3;
}
async function resetDB(tracksDB) {
  try {
    await resetArticleDB();
  } catch (error) {
    console.error("pa ", error, "pra");
  }

  try {
    await resetCategoryDB();
  } catch (error) {
    console.error("pa ", error, "pra");
  }

  // try {
  //   await resetConfigDB();
  // } catch (error) {
  //   console.error("pa ", error, "pra");
  // }

  try {
    await resetPlaylistDB();
  } catch (error) {
    console.error("pa ", error, "pra");
  }

  try {
    await resetTracksDB(tracksDB);
  } catch (error) {
    console.error("pa ", error, "pra");
  }
}

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

var port = process.env.PORT || process.env.VCAP_APP_PORT || 3005;

app.listen(port, function() {
  // logger.info("Hs");
  console.log("Server running on port: %d", port);
});

module.exports = {
  convertQueryToPlaylistURLs: convertQueryToPlaylistURLs,
  resetArticleDB: resetArticleDB,
  resetCategoryDB: resetCategoryDB,
  resetConfigDB: resetConfigDB,
  resetPlaylistDB: resetPlaylistDB,
  resetTracksDB: resetTracksDB,
  savePlaylistToDB: savePlaylistToDB
};
