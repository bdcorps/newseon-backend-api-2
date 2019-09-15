var mongoose = require("mongoose");
const chai = require("chai");
const expect = chai.expect;
const { resetDB } = require("../app");

var models = require("../models/models");
var Category = models.CategoryModel;
var Playlist = models.PlaylistModel;
var Article = models.ArticleModel;

var mongodb =
  "mongodb://sssaini1:sssaini1@ds111788.mlab.com:11788/newseon-testing";

describe("Category Model", () => {
  it("has a module", () => {
    expect(Category).to.not.be.undefined;
  });
});

describe("Category Model", () => {
  before(function(done) {
    mongoose.connect(mongodb, {
      useUnifiedTopology: true,
      useNewUrlParser: true
    });
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "connection error"));
    db.once("open", function() {
      console.log("We are connected to test database!");

      const category = new Category({
        id: "what",
        title: "title",
        playlists: [{ playlists: "red" }]
      });
      category.save();

      const playlist = new Playlist({
        id: "id",
        title: "title",
        url: "url",
        media: "media",
        category: "category",
        articles: [{ article: {} }]
      });
      playlist.save();

      const date = new Date("1995-12-17T03:24:00");
      const article = new Article({
        uid: "uid",
        order: 1,
        headline: "headline",
        abstract: "abstract",
        publisher: "publisher",
        media: "media",
        audioTrackID: "audioTrackID",
        publishedOn: date,
        url: "url",
        playlist: { red: "" }
      });
      article.save();

      done();
    });
  });

  after(function(done) {
    mongoose.connection.db.dropDatabase(function() {
      mongoose.connection.close(done);
    });
  });

  after(async () => {
    await mongoose.connection.close();
  });
  describe("reset all dbs", async () => {
    await resetDB();
    it("gets a category", async () => {
      const actual = await Category.findOne({ title: "title" });

      expect(actual).to.be.null;
    });

    it("gets a playlist", async () => {
      const actual = await Playlist.findOne({ title: "title" });
      expect(actual).to.be.null;
    });
  });
});
