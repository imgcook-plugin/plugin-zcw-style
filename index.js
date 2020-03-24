/**
 * Plugin Name: plugin-generate
 *
 * Authors: gindis
 */

const fs = require('fs');
const { unique, downloadImg } = require('@imgcook/cli-utils');
const chalk = require('chalk');

const generatePlugin = async option => {
  let imgArr = [];
  let { data } = option;
  const { filePath, config } = option;
  if (!data.code) return null;
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath);
  }

  const panelDisplay = data.code.panelDisplay || [];
  const moduleData = data.moduleData;
  let index = 0;

  for (const item of panelDisplay) {
    let fileValue = item.panelValue;
    // const temporaryImages = `${(new Date().getTime() + Math.floor(Math.random() * 10000)).toString(30)}`;
    imgArr = fileValue.match(/(https?):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|](\.png|\.jpg)/g);
    
    if(imgArr && imgArr.length > 0) {
      imgArr = unique(imgArr);
      const imgPath = `${filePath}/images`;
      let imgObj = [];
      /** 图片路径映射 **/
      const imgrc = `${imgPath}/.imgrc`;
      if (fs.existsSync(imgrc)) {
        let imgConfig = fs.readFileSync(imgrc, 'utf8');
        imgObj = JSON.parse(imgConfig) || [];
      }
      /** 图片数组循环 **/
      for(let idx = 0; idx < imgArr.length; idx++) {
        // 判断是否存在 images 文件夹，不存在则新建
        if (!fs.existsSync(imgPath)) {
          fs.mkdirSync(imgPath);
        }
        let suffix = imgArr[idx].split('.');
        suffix = suffix[suffix.length - 1];
        const imgName = `img_${moduleData.id}_${index}_${idx}.${suffix}`;
        const imgPathItem = `${imgPath}/${imgName}`;
        let curImgObj = {};
        for (const item of imgObj) {
          if (item.imgUrl === imgArr[idx]) {
            curImgObj = item;
          }
        }
        const reg = new RegExp(imgArr[idx], 'g');
        if (!curImgObj.imgPath) {
          await downloadImg(imgArr[idx], imgPathItem);
          let newImgUrl = '';
          if(moduleData && moduleData.dsl === 'react-zcw-standard') {
            const regex = new RegExp(`"${imgArr[idx]}"`, 'g');
            fileValue = fileValue.replace(regex, `./images/${imgName}`);
          } else {
            fileValue = fileValue.replace(reg, `./images/${imgName}`);
          }
          imgObj.push({
            newImgUrl,
            imgUrl: imgArr[idx],
            imgPath: `./images/${imgName}`
          });
        } else {
          if (option.config && option.config.uploadUrl && option.config.uploadUrl !== 'undefined') {
            fileValue = fileValue.replace(reg, curImgObj.newImgUrl);
          } else {
            fileValue = fileValue.replace(reg, curImgObj.imgPath);
          }
        }
      }
      if (imgObj.length > 0) {
        fs.writeFileSync(imgrc, JSON.stringify(imgObj), 'utf8');
      }
    }
    item.panelValue = fileValue;
    index++;
  }
  let result = {};
  return { data, filePath, config, result };
};

module.exports = (...args) => {
  return generatePlugin(...args).catch(err => {
    console.log(chalk.red(err));
  });
};