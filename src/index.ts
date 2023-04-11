import express, { Application } from "express";
import { load, CheerioAPI } from "cheerio";
import timeout from "connect-timeout";
import fs from "fs";
import axios from "axios";
import path from "path";

const target = "http://ebravo.pk/classic/webtv?cat=All";
const file = path.join(__dirname, "/iptv.m3u");
const host = "http://ebravo.pk/classic/";
const port = process.env.PORT || 3000;
const app: Application = express();

interface Channel {
  name: string;
  url: string;
  thumb: string;
}

app.use(timeout("300s"));

app.get("/", async (req, res) => {
  try {
    fs.unlink(file, (error) => null);
    const web = await (await axios(target)).data;
    await generateFile(await extractChannels(load(web)));
    res.download(file);
  } catch (error) {
    res.end((error as Error).message);
  }
});

const extractChannels = async ($: CheerioAPI) => {
  let channels: Channel[] = [];
  for (let anchor of $(".panel-body a")) {
    const source = (await axios(host + anchor.attribs.href)).data;
    const url = load(source)("video source").get(0)!.attribs!.src;
    const name = url.split("/")[4].split(".")[0];
    const thumb = host + load(anchor)("img").attr("src");
    channels.push({ url, name, thumb });
  }
  return channels;
};

const generateFile = (channels: Channel[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    channels.forEach((channel, i) => {
      const content = `\n\n#EXTINF:0 tvg-id="channel${
        i + 1
      }" tvg-name="Channel ${i + 1}" tvg-logo="${channel.thumb}", ${
        channel.name
      } \n${channel.url}`;
      fs.appendFile(file, content, (err) => {
        if (err) {
          reject((err as Error).message);
        }
        resolve("file created");
      });
    });
  });
};

app.listen(port, () => console.log(`server is running on port: ${port}`));
