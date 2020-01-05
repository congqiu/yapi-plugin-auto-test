const axios = require("axios");

exports.sendWorkWX = async (url, content) => {
  return await axios.post(url, {
    "msgtype": "markdown",
    "markdown": {
      content
    }
  });
};