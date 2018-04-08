const Storage = (function () {
  let localData = {},
    mainData,
    newsData,
    mobilesData,
    reviewData,
    supported = false;

  try {
    supported = 'localStorage' in window && window.localStorage !== null;
  } catch (e) {
  }

  return {
    setData: (prop, value) => {
      if (supported) {
        if (typeof value !== 'string') {
          value = JSON.stringify(value);
        }
        localStorage.setItem(prop, value);
      } else {
        localData[prop] = value;
      }
    },
    getData: (prop) => {
      if (supported) {
        let value = localStorage.getItem(prop);
        try {
          value = JSON.parse(value);
        } catch (err) {
        }
        return value;
      } else {
        return localData[prop];
      }
    },
    removeData: (prop) => {
      if (supported) {
        return localStorage.removeItem(prop);
      } else {
        delete localData[prop];
      }
    },
    keys: () => {
      let keys = [];
      if (supported) {
        for (var i = 0; i < localStorage.length; i++) {
          keys.push(localStorage.key(i));
        }
      } else {
        keys = Object.keys(localData);
      }
      return keys;
    },
    getMainData: () => {
      if (!mainData) {
        fetch("data/main.json")
          .then((response) => {
            return response.text();
          }).then((obj) => {
          mainData = obj;
        });
      }

      return mainData;
    },
    getNewsData: () => {
      if (!newsData) {
        fetch("data/news.json")
          .then((response) => {
            return response.text();
          }).then((obj) => {
          newsData = obj;
        });
      }

      return newsData;
    },
    getReviewData: () => {
      if (!reviewData) {
        fetch("data/review.json")
          .then((response) => {
            return response.text();
          }).then((obj) => {
          reviewData = obj;
        });
      }

      return reviewData;
    },
    getMobilesData: () => {
      if (!mobilesData) {
        fetch("data/mobiles.json")
          .then((response) => {
            return response.text();
          }).then((obj) => {
          mobilesData = obj;
        });
      }

      return mobilesData;
    },
  };
})();
