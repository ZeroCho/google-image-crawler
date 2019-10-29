const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
const request = require('request');
const url  = require('url');
const path = require('path');
const fs = require('fs');

const URI = 'https://www.google.com/search?q=감자볶음&sxsrf=ACYBGNRmgzKgr55d_as9uR43p_WklIc58Q:1572321640723&source=lnms&tbm=isch&sa=X&ved=0ahUKEwj8tfjGysDlAhWDc3AKHZqnA5gQ_AUIEigB&cshid=1572321748623457&biw=1865&bih=1066';
const folder = 'images'; // change to . for current folder

dotenv.config();

const download = function (uri, filename) {
  return new Promise((resolve, reject) => {
    request.head(uri, function (err, res, body) {
      if (err) {
        console.error(err);
      }
      console.log('uri', uri);
      console.log('filename', filename);
      console.log('content-type:', res.headers['content-type']);
      console.log('content-length:', res.headers['content-length']);
      const ext = /png/.test(url) ? 'png' : 'jpg';
      request(uri).pipe(fs.createWriteStream(path.join(__dirname, folder, filename + '.' + ext))).on('close', resolve);
    });
  })
};

const crawler = async () => {
  try {
    const browser = await puppeteer.launch({ headless: false, args: ['--window-size=1920,1080', '--disable-notifications'] });
    const page = await browser.newPage();
    await page.setViewport({
      width: 1080,
      height: 1080,
    });
    await page.goto(URI);
    await page.waitFor(1000);
    const result = await page.evaluate(() => {
      const tags = document.querySelectorAll('a[jsname=hSRGPd]');
      const array = [];
      tags.forEach((tag) => {
        if (tag.href && tag.href !== '#') {
          array.push(tag.href);
        }
      });
      return array;
    });
    result.reduce((promise, href, index) => {
      return promise.then(() => {
        const obj = new url.URL(href);
        let target = decodeURIComponent(obj.searchParams.get('imgurl'));
        const targetObj = new url.URL(target);
        const targetPath = targetObj.pathname;
        targetObj.pathname = encodeURI(targetPath);
        target = url.format(targetObj);
        return download(target, index.toString());
      });
    }, Promise.resolve());
    await page.close();
    await browser.close();
  } catch (e) {
    console.error(e);
  }
};

crawler();
