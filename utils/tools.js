const axios = require("axios");

exports.sendWorkWX = async (url, content) => {
  return await axios.post(url, {
    "msgtype": "markdown",
    "markdown": {
      content
    }
  });
};

const sendWWMessage = async (url, content) => {
  return await axios.post(url, {
    "msgtype": "markdown",
    "markdown": {
      content
    }
  });
};

const sendDingTalk = async (url, title, text) => {
  return await axios.post(url, {
    "msgtype": "markdown",
    "markdown": {
      title,
      text
    }
  });
};

const sendWebhook = async (url, title, content) => {
  return await axios.post(url, {
    title,
    content
  });
};

exports.sendMessage = async (url, title, content) => {
  if (url.trim().indexOf("https://qyapi.weixin.qq.com") === 0) {
    return await sendWWMessage(url, content);
  }
  if (url.trim().indexOf("https://oapi.dingtalk.com/robot/send") === 0) {
    return await sendDingTalk(url, title , content);
  }
  return await sendWebhook(url, content)
}