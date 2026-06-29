import https from 'https';

const urls = [
  { indicator: 'FED_FUNDS_RATE', url: 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=FEDFUNDS' },
  { indicator: 'DXY', url: 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=DTWEXBGS' },
  { indicator: 'BRENT_OIL_PRICE', url: 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=DCOILBRENTEU' }
];

async function checkUrl(indicator: string, url: string) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          indicator,
          url,
          status: res.statusCode,
          contentType: res.headers['content-type'],
          length: data.length,
          snippet: data.substring(0, 100).replace(/\n/g, '\\n')
        });
      });
    }).on('error', (err) => {
      resolve({
        indicator,
        url,
        status: 'error',
        error: err.message
      });
    });
  });
}

async function main() {
  for (const { indicator, url } of urls) {
    const result = await checkUrl(indicator, url);
    console.log(JSON.stringify(result, null, 2));
  }
}

main();
