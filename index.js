const fs = require("fs");
const path = require("path");
const util = require("util");
const del = require("del");
const argv = require("minimist")(process.argv.slice(2));

const readdir = util.promisify(fs.readdir);
const mkdir = util.promisify(fs.mkdir);
const stat = util.promisify(fs.stat);
const link = util.promisify(fs.link);
// const access = util.promisify(fs.access);

const startSort = async () => {
  let oldDir = argv["from"] || "./images";
  let newDir = argv["to"] || "./images_sorted";
  let delOld = argv["del-old"] || false;

  if (oldDir === newDir) {
    console.log("Нельзя указывать одну и ту же папку");
    return;
  }
  // нормализуем пути для разных систем
  oldDir = path.normalize(oldDir);
  newDir = path.normalize(newDir);

  await createDirectory(newDir);
  await sortFiles(oldDir, newDir);
  if (delOld === true) {
    await deleteDirectory(oldDir);
    console.log(delOld);
  }
};

const sortFiles = async (oldDir, newDir) => {
  // оборачиваем async/await в try/catch
  try {
    const files = await readdir(oldDir);

    files.forEach(async item => {
      let localDir = path.join(oldDir, item);
      let state = await stat(localDir);
      if (state.isDirectory()) {
        sortFiles(localDir, newDir);
      } else {
        // берем первую букву названия файла
        let newDirForItem = path.join(newDir, item[0]);
        // если папки, соответствующей этой букве, нету, создаем; иначе ловим ошибку и игнорируем ее
        // fs.access(newDirForItem, fs.constants.F_OK, err => {
        //   console.log(`${newDirForItem} ${err ? "does not exist" : "exists"}`);
        // });

        let isDirExists = await isFilePathExists(newDirForItem);
        console.log(isDirExists);
        if (isDirExists) {
          await link(localDir, path.join(newDirForItem, item));
        } else {
          await mkdir(newDirForItem);
          await link(localDir, path.join(newDirForItem, item));
        }

        // try {
        //   await access(newDirForItem, fs.constants.F_OK);
        // } catch (err) {
        //   console.log(err);
        //   await mkdir(newDirForItem);
        // }

        // try {
        //   await mkdir(newDirForItem);
        // } catch (err) {}

        // затем копируем файл
        // await link(localDir, path.join(newDirForItem, item));
      }
    });
  } catch (err) {
    switch (err.errno) {
      case -4058:
        console.log(err.errno + " Папки не существует");
        break;
      default:
        console.log(err.errno + " Неизвестная ошибка");
        break;
    }
  }
};

const createDirectory = async dirname => {
  // очищаем папку для складывания отсортированных файлов
  await del(dirname);
  await mkdir(dirname);
};

const deleteDirectory = async dirname => {
  await del(dirname);
};

const isFilePathExists = filePath => {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      if (err && err.code === "ENOENT") {
        return resolve(false);
      } else if (err) {
        return reject(err);
      }
      if (stats.isFile() || stats.isDirectory()) {
        return resolve(true);
      }
    });
  });
};

startSort();
