var mongoose = require("mongoose");
const chai = require("chai");
const expect = chai.expect;
const { resetCategoryDB, resetArticleDB, resetPlaylistDB } = require("../app");
const mongodb = require("mongodb");

var models = require("../models/models");
var Category = models.CategoryModel;
var Playlist = models.PlaylistModel;
var Article = models.ArticleModel;

var dburl =
  "mongodb://sssaini1:sssaini1@ds111788.mlab.com:11788/newseon-testing";

describe("Category Model", () => {
  it("has a module", () => {
    expect(Category).to.not.be.undefined;
  });
});

describe("Reset Model", () => {
  before(function(done) {
    mongoose.connect(dburl, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useFindAndModify: false
    });
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "connection error"));
    db.once("open", function() {
      console.log("We are connected to test database!");

      done();
    });
  });

  after(function(done) {
    mongoose.connection.db.dropDatabase(function() {
      mongoose.connection.close(done);
    });
  });

  describe("reset cat dbs", async () => {
    before(() => {
      const category = new Category({
        id: "what",
        title: "title",
        playlists: [{ playlists: "red" }]
      });
      category.save();
    });

    it("reset category", async () => {
      await resetCategoryDB();
      const actual = await Category.findOne({ title: "title" });
      expect(actual).to.be.null;
    });
  });

  describe("reset playlist dbs", async () => {
    before(() => {
      const playlist = new Playlist({
        id: "id",
        title: "title",
        url: "url",
        media: "media",
        category: "category",
        articles: [{ article: {} }]
      });
      playlist.save();
    });

    it("reset playlist", async () => {
      await resetPlaylistDB();
      const actual = await Playlist.findOne({ title: "title" });
      expect(actual).to.be.null;
    });
  });

  describe("reset article dbs", async () => {
    before(() => {
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
    });

    it("reset article", async () => {
      await resetArticleDB();
      const actual = await Article.findOne({ uid: "uid" });
      console.dir(actual);
      expect(actual).to.be.null;
    });
  });
});
