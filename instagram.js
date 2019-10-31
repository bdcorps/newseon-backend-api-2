const puppeteer = require("puppeteer");
require("dotenv").config();
const screenshot = "booking_results.png";

var INSTAGRAM_USERNAME = process.env.INSTAGRAM_USERNAME;
var INSTAGRAM_PASSWORD = process.env.INSTAGRAM_PASSWORD;

const config = {
  base_url: "https://www.instagram.com",
  hashTags: [
    "cars",
    "cat",
    "soccer",
    "javascript",
    "places",
    "football",
    "Motivation"
  ],
  settings: {
    run_every_x_hours: 3,
    like_ratio: 0.75,
    unfollow_after_days: 2,
    headless: false
  },
  selectors: {
    home_to_login_button: ".izU2O a",
    username_field: 'input[type="text"]',
    password_field: 'input[type="password"]',
    login_button: 'button[type="submit"]',
    post_heart_grey: "span.glyphsSpriteHeart__outline__24__grey_9",
    post_username: "div.e1e1d > h2.BrX75 > a",
    post_follow_link: ".bY2yH > button",
    post_like_button: "span.fr66n > button",
    post_follow_button: "span.oW_lN._1OSdk > button",
    post_close_button: "button.ckWGn",
    user_unfollow_button: "span.vBF20 > button._5f5mN",
    user_unfollow_confirm_button: "div.mt3GC > button.aOOlW.-Cab_",
    not_now_button: ".HoLwm",
    hash_tags_base_class: ".EZdmt"
  }
};

try {
  (async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(config.base_url, { timeout: 60000 });
    await page.waitFor(2500);
    await page.click(config.selectors.home_to_login_button);
    await page.waitFor(2500);
    /* Click on the username field using the field selector*/
    await page.click(config.selectors.username_field);
    await page.keyboard.type(INSTAGRAM_USERNAME);
    await page.click(config.selectors.password_field);
    await page.keyboard.type(INSTAGRAM_PASSWORD);

    await page.click(config.selectors.login_button);
    await page.waitForNavigation();
    //Close Turn On Notification modal after login

    if ((await page.$(config.selectors.not_now_button)) !== null) {
      console.log("found");
      await page.click(config.selectors.not_now_button);
    } else {
      console.log("not found");
    }

    // await browser.close();
    console.log("See screenshot: " + screenshot);
  })();
} catch (err) {
  console.error(err);
}
