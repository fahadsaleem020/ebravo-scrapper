import express, { Application } from "express";
import { load, CheerioAPI } from "cheerio";
import timeout from "connect-timeout";
import fs from "fs";
import axios from "axios";
import path from "path";

const target = "http://ebravo.pk/classic/webtv?cat=All";
const filePath = path.join(__dirname, "/iptv.m3u");
const host = "http://ebravo.pk/classic/";
const port = process.env.PORT || 3000;
const app: Application = express();

interface Channel {
  name: string;
  url: string;
}

app.use(timeout("600s"));
app.get("/", async (req, res) => {
  try {
    fs.unlink(filePath, (error) => null);
    const web = await (await axios(target)).data;
    await generateFile(await extractChannels(load(web)));
    res.download(filePath);
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
    channels.push({ url, name });
  }
  return channels;
};

const generateFile = (channels: Channel[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    channels.forEach((channel, i) => {
      const content = `\n\n#EXTINF:${i + 1}, ${channel.name} \n${channel.url}`;
      fs.appendFile(filePath, content, (err) => {
        if (err) {
          reject((err as Error).message);
        }
        resolve("file created");
      });
    });
  });
};

app.listen(port, () => console.log(`server is running on port: ${port}`));
