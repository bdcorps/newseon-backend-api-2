var mongoose = require("mongoose");
const chai = require("chai");
const expect = chai.expect;
const assert = chai.assert;

var models = require("../models/models");
var Playlist = models.PlaylistModel;

var mongodb =
  "mongodb://sssaini1:sssaini1@ds111788.mlab.com:11788/newseon-testing";

describe("Playlist Model", () => {
  it("has a module", () => {
    expect(Playlist).to.not.be.undefined;
  });
});

describe("Playlist Model", () => {
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

  after(async () => {
    await mongoose.connection.close();
  });
  describe("get cateogry", () => {
    it("gets a playlist", async () => {
      const playlist = new Playlist({
        id: "id",
        title: "title",
        url: "url",
        media: "media",
        category: "category",
        articles: [{ article: {} }]
      });
      await playlist.save();

      const foundPlaylist = await Playlist.findOne({ title: "title" });
      const expected = "title";
      const actual = foundPlaylist.title;
      expect(actual).equal(expected);
    });
  });

  describe("save playlist", () => {
    it("saves a playlist", async () => {
      const playlist = new Playlist({
        id: "id",
        title: "title",
        url: "url",
        media: "media",
        category: "category",
        articles: [{ article: {} }]
      });
      const savedPlaylist = await playlist.save();

      const expected = "title";
      const actual = savedPlaylist.title;
      expect(actual).equal(expected);
    });
  });

  describe("update playlist", () => {
    it("updates a playlist", async () => {
      const playlist = new Playlist({
        id: "id",
        title: "title",
        url: "url",
        media: "media",
        category: "category",
        articles: [{ article: {} }]
      });
      await playlist.save();

      playlist.title = "what2";
      const updatedPlaylist = await playlist.save();

      const expected = "what2";
      const actual = updatedPlaylist.title;
      expect(actual).equal(expected);
    });
  });
});
