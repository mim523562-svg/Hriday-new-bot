/**
 * ╔══════════════════════════════════════════════╗
 * ║          🎙️ HRIDOY TEXT VOICE V9            ║
 * ║        💠 HRIDOY HASAN SHANTO 💠            ║
 * ║           MIRAI BOT COMPATIBLE               ║
 * ╚══════════════════════════════════════════════╝
 */

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "cache");
const STATE_FILE = path.join(__dirname, "voiceState.json");

const textAudioMap = {
  "🤖": ["https://files.catbox.moe/l0jhdq.mp3"],
  "আই লাভ ইউ": ["https://files.catbox.moe/z96wll.mp3"],
  "i love you": ["https://files.catbox.moe/y3fk8i.mp3"],
  "love you": ["https://files.catbox.moe/y3fk8i.mp3"],

  "🥱": [
    "https://files.catbox.moe/mofu8n.mp3",
    "https://files.catbox.moe/088yxs.mp3"
  ],

  "ভয়েস": ["https://files.catbox.moe/b973ms.mp4"],
  "ভয়েস": ["https://files.catbox.moe/b973ms.mp4"],
  "🤏": ["https://files.catbox.moe/8w1wo5.mp3"],
  "এহ": ["https://files.catbox.moe/6tkyn2.mp3"],
  "ডিলেট": ["https://files.catbox.moe/kcemka.mp4"],
  "🤦‍♂️": ["https://files.catbox.moe/5rdtc6.mp3"],
  "mata beta": ["https://files.catbox.moe/5rdtc6.mp3"],
  "🫠": ["https://files.catbox.moe/dz7n65.mp3"],
  "সর বাল": ["https://files.catbox.moe/q84p1d.mp3"],
  "কেউ নাই": ["https://files.catbox.moe/3u6shs.mp3"],
  "good night": ["https://files.catbox.moe/i29m4q.mp3"],
  "গুড নাইট": ["https://files.catbox.moe/i29m4q.mp3"],
  "good morning": ["https://files.catbox.moe/8gzqx5.mp3"],
  "গুড মর্নিং": ["https://files.catbox.moe/8gzqx5.mp3"],
  "@everyone": ["https://files.catbox.moe/3u6shs.mp3"],
  "ভুদা": ["https://files.catbox.moe/gnyx0p.mp3"],
  "by": ["https://files.catbox.moe/fdqh2m.mp3"],
  "বাই": ["https://files.catbox.moe/fdqh2m.mp3"],
  "বায়": ["https://files.catbox.moe/fdqh2m.mp3"],
  "🫵😡": ["https://files.catbox.moe/yuonxq.mp3"],
  "🤨": ["https://files.catbox.moe/995anc.mp3"],
  "dirim": ["https://files.catbox.moe/1rk48q.mp4"],
  "চুদি": ["https://files.catbox.moe/0ykb7f.mp3"],

  "☺️": ["https://files.catbox.moe/p2mi4u.mp3"],
  "😊": ["https://files.catbox.moe/p2mi4u.mp3"],
  "🌚": ["https://files.catbox.moe/ze3wu1.mp3"],
  "🌝": ["https://files.catbox.moe/ze3wu1.mp3"],
  "🐸": ["https://files.catbox.moe/9u1857.mp3"],
  "👀": ["https://files.catbox.moe/372kl0.mp3"],
  "🖕": ["https://files.catbox.moe/372kl0.mp3"],
  "😁": ["https://files.catbox.moe/ef6me4.mp3"],
  "🤣": ["https://files.catbox.moe/ipihl6.mp3"],
  "😆": ["https://files.catbox.moe/r4unub.mp3"],
  "😑": ["https://files.catbox.moe/z1evci.mp3"],
  "😅": ["https://files.catbox.moe/7hvdo6.mp3"],
  "😍": ["https://files.catbox.moe/r13v24.mp3"],
  "😒": ["https://files.catbox.moe/ww8yts.mp3"],
  "💋": ["https://files.catbox.moe/hd0zfr.mp3"],
  "😘": ["https://files.catbox.moe/hd0zfr.mp3"],
  "😡": ["https://files.catbox.moe/b5y405.mp3"],
  "🤬": ["https://files.catbox.moe/b5y405.mp3"],
  "😩": ["https://files.catbox.moe/vb01zl.mp3"],
  "😭": ["https://files.catbox.moe/d9w35v.mp3"],
  "🙂": ["https://files.catbox.moe/flp9ed.mp3"],
  "🙏": ["https://files.catbox.moe/2aw07b.mp3"],
  "😂": ["https://files.catbox.moe/vknlt2.mp3"],
  "🤭": ["https://files.catbox.moe/5s606f.mp3"],
  "🥰": ["https://files.catbox.moe/1ojauw.mp3"],
  "🥵": ["https://files.catbox.moe/c0odmp.mp3"],
  "🥺": ["https://files.catbox.moe/458umf.mp3"],
  "🥹": ["https://files.catbox.moe/cj6ny7.mp3"],
  "🫶": ["https://files.catbox.moe/hyo82t.mp3"],
  "🫣": ["https://files.catbox.moe/2qjfwl.mp3"],
  "🍼": ["https://files.catbox.moe/gvrvkh.mp3"],
  "👍": ["https://files.catbox.moe/mkvysb.mp3"]
};

function normalize(value) {
  return String(value || "")
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function isVoiceEnabled() {
  try {
    if (!fs.existsSync(STATE_FILE)) return true;
    return fs.readJsonSync(STATE_FILE).enabled !== false;
  } catch (error) {
    console.error("[VOICE STATE]", error.message);
    return true;
  }
}

async function setVoiceEnabled(enabled) {
  await fs.ensureDir(__dirname);
  await fs.writeJson(
    STATE_FILE,
    { enabled: Boolean(enabled) },
    { spaces: 2 }
  );
}

function getRandomVoice(body) {
  const key = normalize(body);

  for (const [trigger, urls] of Object.entries(textAudioMap)) {
    if (normalize(trigger) === key && urls.length) {
      return urls[Math.floor(Math.random() * urls.length)];
    }
  }

  return null;
}

const processed = new Set();

function alreadyProcessed(id) {
  if (!id) return false;

  const key = String(id);
  if (processed.has(key)) return true;

  processed.add(key);

  setTimeout(() => processed.delete(key), 30000);

  if (processed.size > 2000) {
    processed.delete(processed.values().next().value);
  }

  return false;
}

const helpText = `
╔══════════════════════════════╗
       🎙️ HRIDOY TEXT VOICE V9
╚══════════════════════════════╝

🎛️ CONTROL
.voice on
.voice off
.voice status

📋 LIST
voice list
ভয়েস লিস্ট

💠 HRIDOY HASAN SHANTO 💠
`;

module.exports.config = {
  name: "text_voice",
  version: "9.0.0",
  hasPermssion: 0,
  credits: "💠 HRIDOY HASAN SHANTO 💠",
  description: "Mirai text voice and persistent ON/OFF",
  commandCategory: "noprefix",
  usages: ".voice on/off/status",
  cooldowns: 1
};

async function processVoice(api, event) {
  if (!api || !event || !event.threadID) return;

  const body = normalize(event.body);
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!body) return;

  // ON/OFF/STATUS commands
  if ([".voice on", ".voice off", ".voice status"].includes(body)) {
    if (alreadyProcessed(messageID)) return;

    try {
      if (body === ".voice on") {
        await setVoiceEnabled(true);
      } else if (body === ".voice off") {
        await setVoiceEnabled(false);
      }

      const enabled = isVoiceEnabled();

      const message = body === ".voice status"
        ? `🎙️ Voice Status: ${enabled ? "🟢 ON" : "🔴 OFF"}`
        : `🎙️ Text Voice ${enabled ? "🟢 ON" : "🔴 OFF"} করা হয়েছে!`;

      return api.sendMessage(
        `${message}\n💠 HRIDOY HASAN SHANTO 💠`,
        threadID,
        messageID
      );
    } catch (error) {
      console.error("[VOICE CONTROL]", error.stack || error);

      return api.sendMessage(
        "❌ Voice setting save করা যায়নি।",
        threadID,
        messageID
      );
    }
  }

  if (
    ["voice list", "voicelist", "text voice", "textvoice",
     "ভয়েস লিস্ট", "ভয়েস লিস্ট", "🎤"].includes(body)
  ) {
    if (alreadyProcessed(messageID)) return;
    return api.sendMessage(helpText, threadID, messageID);
  }

  if (!isVoiceEnabled()) return;
  if (alreadyProcessed(messageID)) return;

  const audioUrl = getRandomVoice(body);
  if (!audioUrl) return;

  let filePath;

  try {
    await fs.ensureDir(CACHE_DIR);

    const extension = /\.mp4(?:\?|$)/i.test(audioUrl)
      ? ".mp4"
      : ".mp3";

    const safeID = String(messageID || Date.now())
      .replace(/[^a-zA-Z0-9_-]/g, "");

    filePath = path.join(CACHE_DIR, `voice_${safeID}${extension}`);

    const response = await axios.get(audioUrl, {
      responseType: "arraybuffer",
      timeout: 25000,
      maxRedirects: 5,
      validateStatus: status => status >= 200 && status < 300
    });

    if (!response.data || response.data.byteLength === 0) {
      throw new Error("Empty audio response");
    }

    await fs.writeFile(filePath, response.data);

    await new Promise((resolve, reject) => {
      let doneOnce = false;

      const done = error => {
        if (doneOnce) return;
        doneOnce = true;
        error ? reject(error) : resolve();
      };

      try {
        api.sendMessage(
          { attachment: fs.createReadStream(filePath) },
          threadID,
          done,
          messageID
        );
      } catch (error) {
        done(error);
      }
    });
  } catch (error) {
    console.error("[TEXT VOICE ERROR]", error.stack || error);
  } finally {
    if (filePath) {
      setTimeout(() => {
        fs.remove(filePath).catch(() => {});
      }, 10000);
    }
  }
}

// Keep one event handler only.
module.exports.handleEvent = async function ({ api, event }) {
  return processVoice(api, event);
};

module.exports.run = async function ({ api, event, args, threadID }) {
  const currentEvent = event || {
    threadID,
    messageID: null,
    body: Array.isArray(args) ? args.join(" ") : String(args || "")
  };

  return processVoice(api, currentEvent);
};
