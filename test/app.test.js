var chai = require("chai");
var expect = chai.expect;
const { convertQueryToPlaylistURLs } = require("../app");
const {
  MISSING_PLAYLIST_QUERY,
  MISSING_PLAYLIST_TYPE,
  MISSING_PLAYLIST
} = require(".././utils/consts");

const query1 = [
  {
    type: "everything",
    title: "Technology",
    query: {
      sources: "engadget",
      langugage: "en",
      pageSize: "10"
    }
  }
];

const query2 = [
  {
    title: "Technology",
    query: {
      sources: "engadget",
      langugage: "en",
      pageSize: "10"
    }
  }
];
const query3 = [
  {
    type: "everything",
    title: "Technology"
  }
];

const query4 = [null];

describe("Testing App functions", function() {
  describe("Convert Query to Playlists", function() {
    it("correctly converts query to playlist url", function() {
      const actual = convertQueryToPlaylistURLs(query1, "title")[0];

      expect(actual.id).to.be.a("string");
      expect(actual.title).to.equal("Technology");
      expect(actual.url).to.be.a("string");
      expect(actual.media).to.be.a("string");
    });

    it("correctly throws missing playlist property: type", function() {
      const actual = function() {
        convertQueryToPlaylistURLs(query2, "title");
      };

      expect(actual).to.throw(MISSING_PLAYLIST_TYPE);
    });

    it("correctly throws missing playlist property: query", function() {
      const actual = function() {
        convertQueryToPlaylistURLs(query3, "title");
      };

      expect(actual).to.throw(MISSING_PLAYLIST_QUERY);
    });

    it("correctly throws missing playlist ", function() {
      const actual = function() {
        convertQueryToPlaylistURLs(query4, "title");
      };

      expect(actual).to.throw(MISSING_PLAYLIST);
    });
  });

  describe("Convert Query to Playlists", function() {
    it("correctly converts query to playlist url", function() {
      const actual = convertQueryToPlaylistURLs(query1, "title")[0];

      expect(actual.id).to.be.a("string");
      expect(actual.title).to.equal("Technology");
      expect(actual.url).to.be.a("string");
      expect(actual.media).to.be.a("string");
    });
  });
});
