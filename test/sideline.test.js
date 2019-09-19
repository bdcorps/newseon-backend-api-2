var sideline = require("../sideline");

var chai = require("chai");
var expect = chai.expect;
var assert = chai.assert;
var sinon = require("sinon");

describe("Convert Query to Playlists", function() {
  it("correctly converts query to playlist url", function() {
    const spy = sinon.spy(sideline, "b");

    const actual = sideline.a();
    console.log(actual);
    expect(spy.called).to.be.true;
  });
});
