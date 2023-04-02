"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cheerio_1 = require("cheerio");
const connect_timeout_1 = __importDefault(require("connect-timeout"));
const fs_1 = __importDefault(require("fs"));
const axios_1 = __importDefault(require("axios"));
const path_1 = __importDefault(require("path"));
const target = "http://ebravo.pk/classic/webtv?cat=All";
const filePath = path_1.default.join(__dirname, "/iptv.m3u");
const host = "http://ebravo.pk/classic/";
const port = process.env.PORT || 3000;
const app = (0, express_1.default)();
app.use((0, connect_timeout_1.default)("600s"));
app.get("/online", (req, res) => res.end("online"));
app.get("/api/online", (req, res) => res.end("online"));
app.get("/", (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      fs_1.default.unlink(filePath, (error) => null);
      const web = yield (yield (0, axios_1.default)(target)).data;
      yield generateFile(yield extractChannels((0, cheerio_1.load)(web)));
      res.download(filePath);
    } catch (error) {
      res.end(error.message);
    }
  })
);
const extractChannels = ($) =>
  __awaiter(void 0, void 0, void 0, function* () {
    let channels = [];
    for (let anchor of $(".panel-body a")) {
      const source = (yield (0, axios_1.default)(host + anchor.attribs.href))
        .data;
      const url = (0, cheerio_1.load)(source)("video source").get(0).attribs
        .src;
      const name = url.split("/")[4].split(".")[0];
      channels.push({ url, name });
    }
    return channels;
  });
const generateFile = (channels) => {
  return new Promise((resolve, reject) => {
    channels.forEach((channel, i) => {
      const content = `\n\n#EXTINF:${i + 1}, ${channel.name} \n${channel.url}`;
      fs_1.default.appendFile(filePath, content, (err) => {
        if (err) {
          reject(err.message);
        }
        resolve("file created");
      });
    });
  });
};
module.exports = app;
