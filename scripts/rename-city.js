import fs from 'fs';
import path from 'path';

// 假设 gh-pages 的内容拉取到了本地的 dist 或 gh-pages 目录，或者直接修改 history 存放目录
const historyDir = path.resolve('./history'); // 替换为你的历史数据实际存放路径
const statusFile = path.resolve('./weather-status.json');

// 1. 修改 weather-status.json
if (fs.existsSync(statusFile)) {
  const data = JSON.parse(fs.readFileSync(statusFile, 'utf-8'));
  data.forEach(item => {
    if (item.id === '101210401') {
      item.name = '宁波';
    }
  });
  fs.writeFileSync(statusFile, JSON.stringify(data, null, 2), 'utf-8');
  console.log('✅ weather-status.json 已更新');
}

// 2. 批量修改 history 文件夹下的所有 JSON 文件
if (fs.existsSync(historyDir)) {
  const files = fs.readdirSync(historyDir);
  files.forEach(file => {
    if (file.endsWith('.json')) {
      const filePath = path.join(historyDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      // 如果数据结构是数组
      if (Array.isArray(content)) {
        content.forEach(item => {
          if (item.id === '101210401') item.name = '宁波';
        });
      } else if (content.id === '101210401') { // 如果是单个对象
        content.name = '宁波';
      }

      fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');
    }
  });
  console.log(`✅ ${historyDir} 下的历史 JSON 文件已批量替换完成`);
}
