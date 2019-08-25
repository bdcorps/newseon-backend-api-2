const request = require("request");

//copied from app.js
//need to be added to a helper file
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

var reloadContentAsync = async () => {
  await snooze(5000);
  request("http://newseon-backend-api-2.herokuapp.com/resetv2", function(
    error,
    response,
    body
  ) {
    console.log("error:", error);
    console.log("statusCode:", response && response.statusCode);
    console.log("body:", body);
  });
  await snooze(5000);
  console.log("Generating.");
  request("http://newseon-backend-api-2.herokuapp.com/generatev2", function(
    error,
    response,
    body
  ) {
    console.log("error:", error);
    console.log("statusCode:", response && response.statusCode);
    console.log("body:", body);
  });

  await snooze(5000);
  console.log("Writing.");
  request("http://newseon-backend-api-2.herokuapp.com/writesv2", function(
    error,
    response,
    body
  ) {
    console.log("error:", error);
    console.log("statusCode:", response && response.statusCode);
    console.log("body:", body);
  });

  await snooze(5000);
  console.log("Creating Tracks.");
  request("http://newseon-backend-api-2.herokuapp.com/tracksv2", function(
    error,
    response,
    body
  ) {
    console.log("error:", error);
    console.log("statusCode:", response && response.statusCode);
    console.log("body:", body);
  });
};

reloadContentAsync();
