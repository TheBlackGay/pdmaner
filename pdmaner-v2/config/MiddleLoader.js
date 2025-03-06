let loaderUtils = require('loader-utils');

module.exports = function (content) {
    if(this.cacheable) this.cacheable();
    let query = loaderUtils.getOptions(this) || {};
    let platform = query.platform;
    let importFile = `import * as json from './${platform}';`;
    let platformVar = `export const platform = '${platform}'`;
    return `${importFile  }\n${  platformVar  }\n${  content}`;
};
