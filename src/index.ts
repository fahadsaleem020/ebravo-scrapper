import { load, CheerioAPI } from "cheerio";
import timeout from "connect-timeout";
import { Server } from "socket.io";
import express from "express";
import axios from "axios";
import cors from "cors";
import http from "http";
import path from "path";
import fs from "fs";

// const tvTarget = `http://ebravo.pk/classic/webtv?cat=`;
const tvTarget = `https://ebuzz.world/classic/webtv?cat=`;
const file = path.join(__dirname, "/iptv.m3u");
const host = "https://ebuzz.world/classic/";
const port = process.env.PORT || 3000;
const app = express();

const server = http.createServer(app);
const io = new Server(server);

interface Channel {
  thumb: string;
  title: string;
  url: string;
}

app.use(express.static("public"));
app.use(express.static("dist"));
app.use(timeout("300s"));
app.use(express.json());
app.use(cors());

app.get("/scrapTv/:cat/:id", async (req, res) => {
  const tvCat = req.params.cat;
  const id = req.params.id;

  try {
    fs.unlink(file, (error) => null);

    console.log("loading ebravo.pk...");
    const web = await (await axios(tvTarget + tvCat)).data;

    console.log("====scrapping channels====");
    await extractChannels(load(web), io, id);
    console.log("====Scrapping successfull====");
    res.end("last statement");
  } catch (error) {
    res.end((error as Error).message);
  }
});

const extractChannels = async ($: CheerioAPI, io: Server, socketId: string) => {
  let channels: Channel[] = [];
  const channelAnchors = $(".panel-body a").toArray();

  await Promise.all(
    channelAnchors.map(async (anchor, key) => {
      const anchorResponse = (await axios.get(host + anchor.attribs.href)).data;
      const thumb =
        host + $($(".panel-body .col-item img").get(key)).attr("src");
      const url = load(anchorResponse)("video source").get(0)!.attribs.src;
      const title = $($(".panel-body .col-item h6").get(key)).text();

      channels.push({ url, title, thumb });

      const percentage = Math.round(
        (channels.length / channelAnchors.length) * 100
      );

      console.clear();
      console.log(`${percentage}% completed...`);

      io.to(socketId).emit("scrapstatus", {
        channel: { url, title, thumb },
        totalChannels: channelAnchors.length,
      });
    })
  );
  return channels;
};

app.post("/downloadfile", async (req, res) => {
  const channels: Channel[] = req.body.channels;
  try {
    await generateFile(channels);
    res.download(file);
  } catch (error) {
    res.status(500).send((error as Error).message);
  }
});

const generateFile = (channels: Channel[]) => {
  return new Promise((resolve, reject) => {
    channels.forEach((channel, i) => {
      const content = `\n\n#EXTINF:0 tvg-id="channel${
        i + 1
      }" tvg-name="Channel ${i + 1}" tvg-logo="${channel.thumb}", ${
        channel.title
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

server.listen(port, () => console.log(`server is running on port: ${port}`));
