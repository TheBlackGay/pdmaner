// 打包时判断是否是网页版还是桌面版

//import * as json from './json';

const saveJsonPromise = json.saveJsonPromise;
const readJsonPromise = json.readJsonPromise;
const saveJsonPromiseAs = json.saveJsonPromiseAs;
const getUserConfig = json.getUserConfig;
const saveUserConfig = json.saveUserConfig;
const getJavaHome = json.getJavaHome;
const execFileCmd = json.execFileCmd;
const getPathStep = json.getPathStep;
const openProjectFilePath = json.openProjectFilePath;
const openFileOrDirPath = json.openFileOrDirPath;
const getAllVersionProject = json.getAllVersionProject;
const getAllVersionFile = json.getAllVersionFile;
const getOneVersion = json.getOneVersion;
const removeAllVersionProject = json.removeAllVersionProject;
const connectDB = json.connectDB;
const ensureDirectoryExistence = json.ensureDirectoryExistence;
const dirSplicing = json.dirSplicing;
const fileExists = json.fileExists;
const deleteFile = json.deleteFile;
const dirname = json.dirname;
const saveFile = json.saveFile;
const saveTempImages = json.saveTempImages;
const saveAsTemplate = json.saveAsTemplate;
const selectWordFile = json.selectWordFile;
const selectDir = json.selectDir;
const writeLog = json.writeLog;
const showItemInFolder = json.showItemInFolder;
const getLogPath = json.getLogPath;
const showErrorLogFolder = json.showErrorLogFolder;
const basename = json.basename;
const getBackupAllFile = json.getBackupAllFile;
const saveVersion = json.saveVersion;
const deleteVersion = json.deleteVersion;
const renameVersion = json.renameVersion;
const saveAllTemplate = json.saveAllTemplate;
const saveImages = json.saveImages;
const extractFile = json.extractFile;
const renameBackupAllFile = json.renameBackupAllFile;
const getBackupAllFileData = json.getBackupAllFileData;
const getFilePath = json.getFilePath;

export {
  saveJsonPromise,
  readJsonPromise,
  saveJsonPromiseAs,
  getUserConfig,
  saveUserConfig,
  openFileOrDirPath,
  getJavaHome,
  execFileCmd,
  getPathStep,
  openProjectFilePath,
  getAllVersionProject,
  getAllVersionFile,
  getOneVersion,
  removeAllVersionProject,
  connectDB,
  ensureDirectoryExistence,
  dirSplicing,
  fileExists,
  deleteFile,
  dirname,
  saveFile,
  saveTempImages,
  saveAsTemplate,
  selectWordFile,
  writeLog,
  showItemInFolder,
  getLogPath,
  showErrorLogFolder,
  basename,
  getBackupAllFile,
  saveVersion,
  deleteVersion,
  renameVersion,
  saveAllTemplate,
  saveImages,
  extractFile,
  renameBackupAllFile,
  getBackupAllFileData,
  getFilePath,
  selectDir,
};

