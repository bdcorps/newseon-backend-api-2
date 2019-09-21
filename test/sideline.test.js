var sideline = require("../sideline");

var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

describe("Sideline", function() {
  it("correct sinon stub sideline", function() {
    const aStub = sinon.stub(sideline, "a");
    sideline.b();
    expect(aStub.calledOnce).to.equal(true);
  });
});
