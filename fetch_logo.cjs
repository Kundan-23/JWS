const https = require('https');
const fs = require('fs');
const agent = new https.Agent({ rejectUnauthorized: false });

https.get('https://giclsports.com', { agent }, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const match = data.match(/<img[^>]+src=[\"']([^\"']+)[\"']/i);
    if (match) {
        console.log(match[1]);
    } else {
        console.log("not found");
    }
  });
});
