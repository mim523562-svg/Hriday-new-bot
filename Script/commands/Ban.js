
/**
 * ╔══════════════════════════════════════════════╗
 * ║          🛡️ BOT AUTO BAN SYSTEM V4           ║
 * ║       💠 HRIDOY HASAN SHANTO 💠              ║
 * ║          MIRAI BOT - SAFE MODE               ║
 * ╚══════════════════════════════════════════════╝
 */

const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

module.exports.config = {
    name: "botautoban",
    version: "4.0.0",
    hasPermssion: 0,
    credits: "💠 HRIDOY HASAN SHANTO 💠",
    description: "Safe bot detection with admin protection",
    commandCategory: "system",
    usages: "botautoban",
    cooldowns: 5
};

// ================================================
// ⚙️ SAFE MODE SETTINGS
// ================================================

const SETTINGS = {
    timezone: "Asia/Kuala_Lumpur",
    autoBan: true,
    minMatches: 2,
    noticeDeleteDelay: 3000,
    logMatches: false
};

// ================================================
// 🔍 HIGH-CONFIDENCE BOT SIGNATURES
// সাধারণ কথাবার্তার শব্দ ইচ্ছাকৃতভাবে বাদ দেওয়া হয়েছে
// ================================================

const englishKeywords = [
    "Command not found",
    "The command you used",
    "You are unable to use bot",
    "Here Is My Prefix",
    "Unable to re-add members",
    "removed 1 message content:",
    "just removed 1 attachment.",
    "just removed 1 Attachments",
    "The current preset is",
    "Error in onChat: Request failed with status code 500",
    "Error: Cannot read properties of undefined",
    "Error: Failed to fetch list",
    "Error: Request failed with status code 404",
    "Request failed with status code 500.",
    "Please provide a question or prompt.",
    "Please provide an image URL",
    "Platform detected: TikTok",
    "Error api Response",
    "This command doesn't exist",
    "CMD Not Found",
    "PREFIX INFO",
    "SYSTEM PREFIX",
    "GROUP PREFIX",
    "Only admins can use bots",
    "User added back automatically!",
    "Type /ban list",
    "Welcome to the clan",
    "To view commands",
    "Bot Owner",
    "Generation failed!",
    "Error: Failed to fetch"
];

const banglaKeywords = [
    "⚠️ একটি ত্রুটি ঘটেছে, দয়া করে পরে আবার চেষ্টা করুন।",
    "⚠️ দুঃখিত, আমি ইউজারটাকে আবার অ্যাড করতে পারিনি",
    "⚠️ Sorry Boss এই আবালকে অ্যাড করলাম না",
    "বার বার Disturb করছিস কোনো",
    "বট বলে চলে যাস কেন",
    "আমি এখন বস",
    "এই কমান্ডটা শুধু আমার বস এর জন্য",
    "User added back automatically!",
    "গ্রুপ: ",
    "সদস্য সংখ্যা:",
    "যোগ করেছেন:",
    "সিস্টেম প্রিফিক্স",
    "গ্রুপ প্রিফিক্স",
    "বট ডিটেক্টেড"
];

const botKeywords = [
    ...new Set([...englishKeywords, ...banglaKeywords])
];

// ================================================
// 🛡️ LOAD ADMIN LIST
// ================================================

function loadAdminList() {
    const admins = new Set();

    // Global config
    try {
        const globalAdmins = global.config?.ADMINBOT;

        if (Array.isArray(globalAdmins)) {
            globalAdmins.forEach(id => {
                if (id != null) admins.add(String(id));
            });
        }
    } catch (error) {
        // Ignore optional config errors
    }

    // Local config fallback
    try {
        const configPath = path.resolve(
            __dirname,
            "..",
            "..",
            "config.json"
        );

        if (fs.existsSync(configPath)) {
            const config = fs.readJsonSync(configPath);
            const localAdmins = config.ADMINBOT || [];

            if (Array.isArray(localAdmins)) {
                localAdmins.forEach(id => {
                    if (id != null) admins.add(String(id));
                });
            }
        }
    } catch (error) {
        console.error(
            "[BOT-AUTOBAN] Config error:",
            error.message
        );
    }

    return [...admins];
}

function isAdmin(senderID) {
    if (senderID == null) return false;

    return loadAdminList().includes(String(senderID));
}

// ================================================
// 🔎 NORMALIZE MESSAGE
// ================================================

function normalizeMessage(text) {
    return String(text || "")
        .normalize("NFKC")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function detectBotMessage(body) {
    const message = normalizeMessage(body);

    if (!message) {
        return [];
    }

    return botKeywords.filter(keyword => {
        const normalizedKeyword = normalizeMessage(keyword);

        // খুব ছোট শব্দ দিয়ে শনাক্ত করা হবে না
        if (normalizedKeyword.length < 12) {
            return false;
        }

        return message.includes(normalizedKeyword);
    });
}

// ================================================
// 👤 GET USER NAME
// ================================================

async function getRealName(api, Users, senderID) {
    try {
        if (Users && typeof Users.getNameUser === "function") {
            const name = await Users.getNameUser(senderID);

            if (name && !/facebook user/i.test(name)) {
                return name;
            }
        }
    } catch (error) {
        // Continue to API fallback
    }

    try {
        if (api && typeof api.getUserInfo === "function") {
            const info = await api.getUserInfo(senderID);

            if (info?.[senderID]?.name) {
                return info[senderID].name;
            }
        }
    } catch (error) {
        // User info may be unavailable
    }

    return "Unknown User";
}

// ================================================
// 📩 SAFE NOTICE
// ================================================

function sendNotice(api, threadID, messageID, userName, senderID) {
    const notice = {
        body:
            "⚠️ সম্ভাব্য বট মেসেজ শনাক্ত হয়েছে!\n" +
            "👤 ব্যবহারকারী: " + userName + "\n" +
            "🛡️ Safe Mode সক্রিয়\n" +
            "💠 HRIDOY HASAN SHANTO 💠",
        mentions: [{
            tag: userName,
            id: String(senderID)
        }]
    };

    api.sendMessage(
        notice,
        threadID,
        (error, info) => {
            if (error || !info?.messageID) return;

            setTimeout(() => {
                api.unsendMessage(info.messageID, () => {});
            }, SETTINGS.noticeDeleteDelay);
        },
        messageID
    );
}

// ================================================
// 🚨 EVENT HANDLER
// ================================================

module.exports.handleEvent = async function ({
    event,
    api,
    Users,
    Threads
}) {
    try {
        if (!event || !api) return;

        const {
            threadID,
            messageID,
            senderID,
            body
        } = event;

        if (
            !threadID ||
            !senderID ||
            !body ||
            typeof body !== "string"
        ) {
            return;
        }

        // নিজের বটের মেসেজ উপেক্ষা
        if (
            String(senderID) ===
            String(api.getCurrentUserID())
        ) {
            return;
        }

        // অ্যাডমিনদের কখনো এই মডিউল থেকে ব্যান করা হবে না
        if (isAdmin(senderID)) {
            return;
        }

        // সম্ভাব্য বট মেসেজ শনাক্ত
        const matches = detectBotMessage(body);

        // Safe Mode: কমপক্ষে দুইটি আলাদা সিগনেচার দরকার
        if (matches.length < SETTINGS.minMatches) {
            return;
        }

        const userName = await getRealName(
            api,
            Users,
            senderID
        );

        const time = moment()
            .tz(SETTINGS.timezone)
            .format("YYYY-MM-DD HH:mm:ss");

        let threadName = "Unknown Group";

        try {
            if (Threads && typeof Threads.getInfo === "function") {
                const info = await Threads.getInfo(threadID);
                threadName = info?.threadName || threadName;
            }
        } catch (error) {
            // Group name is optional
        }

        // Safe Mode: স্বয়ংক্রিয় ব্যান বন্ধ থাকলে শুধু সতর্ক করবে
        if (!SETTINGS.autoBan) {
            sendNotice(
                api,
                threadID,
                messageID,
                userName,
                senderID
            );
            return;
        }

        // Users controller না থাকলে ব্যান করার চেষ্টা নয়
        if (
            !Users ||
            typeof Users.getData !== "function" ||
            typeof Users.setData !== "function"
        ) {
            console.error(
                "[BOT-AUTOBAN] Users controller unavailable"
            );
            return;
        }

        // বর্তমান ডেটা নিরাপদে পড়া
        const userData = await Users.getData(senderID);

        if (!userData || typeof userData !== "object") {
            console.error(
                "[BOT-AUTOBAN] User data unavailable:",
                senderID
            );
            return;
        }

        // আগে থেকেই ব্যান থাকলে আবার প্রক্রিয়া নয়
        if (userData.banned === true) {
            return;
        }

        const reason =
            "Safe Mode bot detection: " +
            matches.join(" | ");

        userData.banned = true;
        userData.reason = reason;
        userData.dateAdded = time;
        userData.threadID = String(threadID);
        userData.threadName = threadName;

        await Users.setData(senderID, {
            data: userData
        });

        // Global ban map থাকলে সেটি আপডেট
        if (
            global.data?.userBanned &&
            typeof global.data.userBanned.set === "function"
        ) {
            global.data.userBanned.set(String(senderID), {
                reason,
                dateAdded: time,
                threadID: String(threadID),
                threadName
            });
        }

        if (SETTINGS.logMatches) {
            console.log(
                "[BOT-AUTOBAN] Detected:",
                String(senderID),
                matches
            );
        }

        sendNotice(
            api,
            threadID,
            messageID,
            userName,
            senderID
        );

    } catch (error) {
        // অপ্রয়োজনীয় স্ট্যাক লগ এড়ানো
        console.error(
            "[BOT-AUTOBAN] Event error:",
            error.message
        );
    }
};

// ================================================
// 📊 COMMAND STATUS
// ================================================

module.exports.run = async function ({ event, api }) {
    const adminList = loadAdminList();

    const status =
        "╔══════════════════════════╗\n" +
        "║     🛡️ BOT DETECT V4     ║\n" +
        "╚══════════════════════════╝\n\n" +
        "✅ System: Active\n" +
        "🛡️ Admin Protection: ON\n" +
        "🔍 Detection Mode: SAFE\n" +
        "🚫 Auto Ban: " +
        (SETTINGS.autoBan ? "ON" : "OFF") +
        "\n" +
        "🔑 Minimum Matches: " +
        SETTINGS.minMatches +
        "\n\n" +
        "📊 English Keywords: " +
        englishKeywords.length +
        "\n" +
        "📊 Bangla Keywords: " +
        banglaKeywords.length +
        "\n" +
        "📊 Unique Keywords: " +
        botKeywords.length +
        "\n" +
        "🛡️ Protected Admins: " +
        adminList.length +
        "\n\n" +
        "💠 HRIDOY HASAN SHANTO 💠";

    return api.sendMessage(status, event.threadID);
};
