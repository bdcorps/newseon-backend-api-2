var mongoose = require("mongoose");
const chai = require("chai");
const expect = chai.expect;

var models = require("../models/models");
var Article = models.ArticleModel;

var mongodb =
  "mongodb://sssaini1:sssaini1@ds111788.mlab.com:11788/newseon-testing";

describe("Article Model", () => {
  it("has a module", () => {
    expect(Article).to.not.be.undefined;
  });
});

describe("Article Model", () => {
  before(function(done) {
    mongoose.connect(mongodb, {
      useUnifiedTopology: true,
      useNewUrlParser: true
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

  describe("get article", () => {
    it("gets an article", async () => {
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
      await article.save();

      const foundArticle = await Article.findOne({ uid: "uid" });
      const expected = "uid";
      const actual = foundArticle.uid;
      expect(actual).equal(expected);
    });
  });

  describe("save article", () => {
    it("saves a article", async () => {
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
      const savedArticle = await article.save();

      const expected = "uid";
      const actual = savedArticle.uid;
      expect(actual).equal(expected);
    });
  });

  describe("update article", () => {
    it("updates a article", async () => {
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
      await article.save();

      article.uid = "uid";
      const updatedArticle = await article.save();

      const expected = "uid";
      const actual = updatedArticle.uid;
      expect(actual).equal(expected);
    });
  });
});
