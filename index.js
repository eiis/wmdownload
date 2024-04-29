const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { PassThrough } = require('stream');

// 根据输入字符串查找分享链接
function findSharUrl(str) {
  const regex = /https:\/\/v\.douyin\.com\/([^/]+)/;
  const match = str.match(regex);
  return match ? match[0] : null;
}

const userAgent = 'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Mobile Safari/537.36';
async function request(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': userAgent,
    }
  });
  return await response.text();
}


// 根据 HTML 内容查找视频 ID
function findVideoId(html) {
  const regex = /video_id%3D([^%]+)/;
  const match = html.match(regex);
  return match ? match[1] : null;
}

// 下载视频
async function downVideo(url, directory) {
  try {
    const fileName = `${+new Date()}.mp4`;
    const fullPath = path.resolve(directory, fileName);

    // 检查目录是否存在，如果不存在，则创建它
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory);
      console.log(`目录 ${directory} 创建成功`);
    }

    const response = await fetch(encodeURI(url));

    // 创建可写流
    const fileStream = fs.createWriteStream(fullPath);

    // 将 PassThrough 流的数据写入本地文件
    const passThroughStream = new PassThrough();
    response.body.pipe(passThroughStream);
    passThroughStream.pipe(fileStream);

    // 等待写入完成
    await new Promise((resolve, reject) => {
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });

    console.log('视频下载成功:', fileName);
  } catch (error) {
    console.error('下载视频出错：', error);
  }
}

async function main() {
  try {
    const shareUrl = findSharUrl('4.12 nDu:/ K@w.fB 04/29 花花小被盖# 小猫治愈世界  https://v.douyin.com/i2dT95W5/ 复制此链接，打开Dou音搜索，直接观看视频！');
    if (!shareUrl) {
      throw new Error('未找到分享链接');
    }

    const html = await request(shareUrl);
    const videoId = findVideoId(html);
    if (!videoId) {
      throw new Error('未找到视频ID');
    }

    const downloadUrl = `https://aweme.snssdk.com/aweme/v1/play/?video_id=${videoId}&line=0&ratio=720p&media_type=4&vr_type=0&improve_bitrate=0&is_play_url=1&source=PackSourceEnum_DOUYIN_REFLOW`;
    await downVideo(downloadUrl, './videos');
  } catch (error) {
    console.error('下载视频出错：', error);
  }
}


main();
