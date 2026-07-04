const http = require('https');

http.get('https://gicl-backend-p0tz.onrender.com/api/config', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Success:', parsed.success);
      console.log('Plans:', JSON.stringify(parsed.config.plans, null, 2));
    } catch(e) {
      console.log('Parse error:', e, data);
    }
  });
}).on('error', (e) => {
  console.log('Request error:', e);
});
