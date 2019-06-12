const fs = require("fs");
const path = require("path");
const util = require("util");
const del = require("del");
const argv = require("minimist")(process.argv.slice(2));

const readdir = util.promisify(fs.readdir);
const mkdir = util.promisify(fs.mkdir);
const stat = util.promisify(fs.stat);
const link = util.promisify(fs.link);
const access = util.promisify(fs.access);

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

        access(newDirForItem, fs.F_OK)
          .then(() => {
            link(localDir, path.join(newDirForItem, item));
          })
          .catch(err => {
            mkdir(newDirForItem)
              .then(() => {
                link(localDir, path.join(newDirForItem, item));
              })
              .catch(err => {
                link(localDir, path.join(newDirForItem, item));
              });
          });
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

startSort();
