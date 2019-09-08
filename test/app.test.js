var chai = require("chai");
var expect = chai.expect;
const { convertQueryToPlaylistURLs } = require("../app");

const query1 = [
  {
    type: "everything",
    title: "Technology",
    query: {
      sources: "engadget,the-verge",
      langugage: "en",
      pageSize: "10"
    }
  }
];
const response1 = [
  {
    id: "fw9a0s8vcs9430d8aui2ev", //id is random
    url:
      "https://newsapi.org/v2/everything?sources=engadget,the-verge&langugage=en&pageSize=10&apiKey=93ca611bceee4039b257ada8985541ce",
    title: "Technology",
    media: ""
  }
];
describe("Testing App functions", function() {
  describe("Convert Query to Playlists", function() {
    it("wwith capitilized first word", function() {
      const actual = convertQueryToPlaylistURLs(query1, "title");

      const expected = actual[0];
      expect(expected.title).to.equal("Technology");
      expect(expected.id).to.be.a("string");
      expect(expected.media).to.be.a("string");
      expect(expected.url).to.be.a("string");
    });
  });
});
