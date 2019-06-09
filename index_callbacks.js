const fs = require("fs");
const path = require("path");
const del = require("del");
const argv = require("minimist")(process.argv.slice(2));

let oldDir = argv["from"] || "./images";
let newDir = argv["to"] || "./images_sorted";
let delOld = argv["del-old"] || false;

const sortFiles = (oldDir, newDir, delOld) => {
  fs.mkdir(newDir, err => {
    fs.readdir(oldDir, (err, files) => {
      files.forEach(item => {
        let localDir = path.join(oldDir, item);

        fs.stat(localDir, (err, state) => {
          if (state.isDirectory()) {
            sortFiles(localDir, newDir);
          } else {
            let newDirForItem = path.join(newDir, item[0]);
            try {
              fs.mkdirSync(newDirForItem);
            } catch (err) {}
            fs.link(localDir, path.join(newDirForItem, item), err => {});
          }

          if (delOld === true) {
            del(oldDir);
          }
        });
      });
    });
  });
};

del(newDir).then(() => sortFiles(oldDir, newDir, delOld));
