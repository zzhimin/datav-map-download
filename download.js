const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 动态导入ora、chalk
(async () => {
  const { default: ora } = await import('ora');
  const { default: chalk } = await import('chalk');

  // 第一步：下载并解析all.json
  const firstStep = async () => {
    const spinner = ora('Downloading all.json').start();
    try {
      const response = await axios.get('https://geo.datav.aliyun.com/areas_v3/bound/all.json');
      spinner.succeed('Downloaded all.json successfully');
      return response.data;
    } catch (error) {
      spinner.fail('Failed to download all.json');
      process.exit(1);
    }
  };

  // 第二步：遍历JSON数组，下载每个adcode对应的json
  const secondStep = async (jsonArray) => {
    let failedDownloads = [];
    let skippedDownloads = [];

    // 确保dist目录存在
    const distPath = path.resolve('dist');
    if (!fs.existsSync(distPath)) {
      fs.mkdirSync(distPath);
    }

    // 逐个下载
    for (let i = 0; i < jsonArray.length; i++) {
      const item = jsonArray[i];
      const adcode = item.adcode;
      const isSpecialCode = adcode.toString().endsWith('00');

      // 构建下载链接和文件名
      const normalFileName = `${adcode}.json`;
      const fullFileName = `${adcode}_full.json`;
      const normalFilePath = path.resolve('dist', normalFileName);
      const fullFilePath = path.resolve('dist', fullFileName);

      // 检查并下载普通文件
      if (!fs.existsSync(normalFilePath)) {
        const spinner = ora(`Downloading ${normalFileName}`).start();
        try {
          const response = await axios.get(`https://geo.datav.aliyun.com/areas_v3/bound/${adcode}.json`);
          fs.writeFileSync(normalFilePath, JSON.stringify(response.data));
          spinner.succeed(chalk.green(`Downloaded ${normalFileName} successfully`));
        } catch (error) {
          spinner.fail(chalk.red(`Failed to download ${normalFileName}`));
          failedDownloads.push(adcode);
        }
      } else {
        skippedDownloads.push(normalFileName);
      }

      // 如果是特殊代码，检查并下载_full文件
      if (isSpecialCode) {
        if (!fs.existsSync(fullFilePath)) {
          const spinner = ora(`Downloading ${fullFileName}`).start();
          try {
            const response = await axios.get(`https://geo.datav.aliyun.com/areas_v3/bound/${adcode}_full.json`);
            fs.writeFileSync(fullFilePath, JSON.stringify(response.data));
            spinner.succeed(chalk.green(`Downloaded ${fullFileName} successfully`));
          } catch (error) {
            spinner.fail(chalk.red(`Failed to download ${fullFileName}`));
            failedDownloads.push(adcode);
          }
        } else {
          skippedDownloads.push(fullFileName);
        }
      }
    }

    // 返回失败的下载列表和跳过的下载列表
    return { failedDownloads, skippedDownloads };
  };

  // 主函数
  const main = async () => {
    const jsonArray = await firstStep();
    const { failedDownloads, skippedDownloads } = await secondStep(jsonArray);

    // 输出跳过的下载
    if (skippedDownloads.length > 0) {
      console.log(chalk.blue(`Skipped downloads: ${skippedDownloads.join(', ')}`));
    }

    // 如果有失败的下载，尝试重新下载
    if (failedDownloads.length > 0) {
      console.log(chalk.yellow(`Retrying failed downloads: ${failedDownloads.join(', ')}`));
      const retryResult = await secondStep(failedDownloads.map(adcode => ({ adcode })));
      if (retryResult.failedDownloads.length > 0) {
        console.log(chalk.red(`Failed downloads after retry: ${retryResult.failedDownloads.join(', ')}`));
      } else {
        console.log(chalk.green('All failed downloads were successful on retry'));
      }
    } else {
      console.log(chalk.green('All downloads completed successfully'));
    }
  };

  main();
})();
