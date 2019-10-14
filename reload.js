var rp = require("request-promise");

var urls = [
  "http://newseon-backend-api-2.herokuapp.com/resetv2",
  "http://newseon-backend-api-2.herokuapp.com/generatev2",
  "http://newseon-backend-api-2.herokuapp.com/writesv2",
  "http://newseon-backend-api-2.herokuapp.com/tracksv2"
];
//copied from app.js
//need to be added to a helper file
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

var reloadContentAsync = async () => {
  for (let i = 0; i < urls.length; i++) {
    console.log(urls[i]);
    await rp(urls[i]);
    await snooze(5200);
  }
};

// reloadContentAsync();

module.exports = {
  reloadContentAsync: reloadContentAsync
};
