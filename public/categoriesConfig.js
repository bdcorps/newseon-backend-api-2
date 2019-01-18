var categoriesJSON = {
  categories: [
    {
      id: "topheadlines",
      title: "Top Headlines",
      playlists: [
        {
          type: "topHeadlines",
          title: "CNN Business",
          query: {
            category: "business",
            source: "http://rss.cnn.com/rss/cnn_business.rss"
          }
        },
        {
          type: "topHeadlines",
          title: "Latest from Bloomberg",
          query: {
            category: "business",
            source: "http://feeds.reuters.com/reuters/businessNews"
          }
        },
        {
          type: "topHeadlines",
          title: "Latest from CNN Tech",
          query: {
            title: "CNN Tech",
            category: "tech",
            source: "http://rss.cnn.com/rss/cnn_tech.rss"
          }
        },
        {
          type: "topHeadlines",
          title: "TechCrunch Updates",
          query: {
            title: "Latest from TechCrunch",
            category: "tech",
            source: "http://feeds.feedburner.com/TechCrunch"
          }
        }
      ]
    }
  ]
};

module.exports = categoriesJSON;
