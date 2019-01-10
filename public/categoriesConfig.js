var categoriesJSON = {
  categories: [
    {
      id: "topheadlines",
      title: "Top Headlines",
      playlists: [
        {
          type: "topHeadlines",
          query: {
            category: "business"
          }
        },
        {
          type: "topHeadlines",
          query: {
            category: "tech"
          }
        }
        
      ]
    }
  ]
};

module.exports = categoriesJSON;
