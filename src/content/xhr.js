export default function (callback) {
  const xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (_, requestUrl) {
    // 限定一下范围，监听 tweet 详情页的数据就好
    if (
      // /(api\.)?twitter\.com\/(i\/api\/)?(2|graphql|1\.1)\//i.test(requestUrl)
      /^https:\/\/twitter.com\/i\/api\/graphql\/[\w-]+\/TweetDetail/.test(
        requestUrl
      )
    ) {
      console.log("[TEST LOG] xhr requestUrl:", requestUrl);

      const xhrSend = this.send;
      this.send = function () {
        const xhrStateChange = this.onreadystatechange;
        this.onreadystatechange = function () {
          const { readyState, responseText } = this;
          if (readyState === XMLHttpRequest.DONE && responseText) {
            try {
              callback(JSON.parse(responseText));
            } catch (e) {
              console.log(e);
            }
          }
          return xhrStateChange.apply(this, arguments);
        };
        return xhrSend.apply(this, arguments);
      };
    }
    return xhrOpen.apply(this, arguments);
  };
}
