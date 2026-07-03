const { Bot, Keyboard } = require("grammy");
const Groq = require("groq-sdk");
const dotenv = require("dotenv");

dotenv.config();

if (!process.env.BOT_TOKEN || !process.env.GROQ_API_KEY) {
    console.error("❌ CRITICAL: CONFIGURATION KEYS MISSING IN .env!");
    process.exit(1);
}

const bot = new Bot(process.env.BOT_TOKEN);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const sessions = new Map();

// Strict Real-World ISO Language Database for Search Validation
const VALID_LANGUAGES = new Set([
    "english", "hindi", "spanish", "arabic", "french", "german", "japanese", "russian", "bengali",
    "burmese", "tamil", "telugu", "marathi", "urdu", "punjabi", "gujarati", "kannada", "malayalam",
    "korean", "italian", "portuguese", "chinese", "turkish", "vietnamese", "thai", "indonesian",
    "persian", "dutch", "polish", "swedish", "filipino", "somali", "afar", "swahili", "hebrew",
    "norwegian", "danish", "finnish", "czech", "greek", "romanian", "hungarian", "ukrainian"
]);

function getUserSession(chatId) {
    if (!sessions.has(chatId)) {
        sessions.set(chatId, {
            sourceLang: "English",
            targetLang: "Hindi",
            lastInput: "",
            expectingText: false,
            settingLangType: null,
            searchingLang: false,
            // Premium Analytics Features
            totalTranslations: 0,
            totalWordsProcessed: 0,
            currentTone: "Standard",
            lastRequestTime: 0
        });
    }
    return sessions.get(chatId);
}

const UI = {
    bar: "💎 ───────────────────── 💎",
    divider: "⚡ ━━━━━━━━━━━━━━━━━━━━━ ⚡"
};

const popularLanguages = [
    ["English", "Hindi", "Spanish"],
    ["Arabic", "French", "German"],
    ["Japanese", "Russian", "Bengali"],
    ["🔍 Search Language", "🔙 Back to Menu"]
];

const toneLayout = [
    ["✨ Standard", "💼 Professional", "🍿 Casual"],
    ["🎬 Cinematic", "🎮 Gamer Mode", "🖤 Emo Style"],
    ["🔙 Back to Menu"]
];

function makeLanguageKeyboard() {
    const kb = new Keyboard();
    popularLanguages.forEach(row => {
        row.forEach(lang => kb.text(lang));
        kb.row();
    });
    return kb.resized();
}

function makeToneKeyboard() {
    const kb = new Keyboard();
    toneLayout.forEach(row => {
        row.forEach(tone => kb.text(tone));
        kb.row();
    });
    return kb.resized();
}

function makeMainKeyboard(s) {
    return new Keyboard()
        .text("🔥 Translate Text").text("🔄 Quick Retry").row()
        .text(`🌐 Source: ${s.sourceLang}`).text(`🎯 Target: ${s.targetLang}`).row()
        .text("🔀 Swap Languages").text(`🎭 Tone: ${s.currentTone}`).row()
        .text("📊 View My Analytics").text("🗑️ Clear Cache")
        .resized();
}

// MAIN START CORE INTERFACE
bot.command("start", async (ctx) => {
    const s = getUserSession(ctx.chat.id);
    s.expectingText = false;
    s.settingLangType = null;
    s.searchingLang = false;

    const welcomeMsg = 
        `✨ **ULTRA FAST PRO AI TRANSLATOR v2.0** ✨\n\n` +
        `🌐 **Source Language:** \`${s.sourceLang}\`\n` +
        `🎯 **Target Language:** \`${s.targetLang}\`\n` +
        `🎭 **Active AI Tone:** \`${s.currentTone}\`\n\n` +
        `💡 *Tap the buttons below to customize tones, swap paths, analyze metrics, or initiate instant high-fidelity translation structural pipeline.*`;
        
    await ctx.reply(welcomeMsg, {
        parse_mode: "Markdown",
        reply_markup: makeMainKeyboard(s)
    });
});

// ROUTING ACTIONS
bot.hears("🔥 Translate Text", async (ctx) => {
    const s = getUserSession(ctx.chat.id);
    s.expectingText = true;
    s.settingLangType = null;
    s.searchingLang = false;
    await ctx.reply("📥 **System Engine Armed. Send the text/script you want to translate now:**", {
        reply_markup: new Keyboard().text("🔙 Back to Menu").resized()
    });
});

bot.hears("🔙 Back to Menu", async (ctx) => {
    const s = getUserSession(ctx.chat.id);
    s.expectingText = false;
    s.settingLangType = null;
    s.searchingLang = false;
    await ctx.reply("✨ **Returned to Master Operational Control Panel.**", { 
        reply_markup: makeMainKeyboard(s) 
    });
});

bot.hears("🔀 Swap Languages", async (ctx) => {
    const s = getUserSession(ctx.chat.id);
    const temp = s.sourceLang;
    s.sourceLang = s.targetLang;
    s.targetLang = temp;
    await ctx.reply(`🔄 **Direction Swapped Successfully!**\n🌐 New Setup: \`${s.sourceLang} ➔ ${s.targetLang}\``, {
        parse_mode: "Markdown",
        reply_markup: makeMainKeyboard(s)
    });
});

bot.hears(/^🎭 Tone:/, async (ctx) => {
    const s = getUserSession(ctx.chat.id);
    s.expectingText = false;
    s.settingLangType = null;
    s.searchingLang = false;
    await ctx.reply("🎭 **Select your desired AI Delivery Mode / Aesthetic Tone:**", {
        reply_markup: makeToneKeyboard()
    });
});

bot.hears(["✨ Standard", "💼 Professional", "🍿 Casual", "🎬 Cinematic", "🎮 Gamer Mode", "🖤 Emo Style"], async (ctx) => {
    const s = getUserSession(ctx.chat.id);
    const selectedTone = ctx.message.text.replace(/[^a-zA-Z模 ]/g, "").trim();
    s.currentTone = selectedTone;
    await ctx.reply(`🎭 **AI Output Tone set to:** \`${s.currentTone}\``, {
        parse_mode: "Markdown",
        reply_markup: makeMainKeyboard(s)
    });
});

bot.hears("📊 View My Analytics", async (ctx) => {
    const s = getUserSession(ctx.chat.id);
    const metricsReport = 
        `📈 **USER OPERATIONS ANALYTICS LOG**\n` +
        `${UI.divider}\n` +
        `🏆 Total API Success Logs: \`${s.totalTranslations}\` requests\n` +
        `📝 Total Words Processed: \`${s.totalWordsProcessed}\` words\n` +
        `⚙️ Current Config: \`${s.sourceLang} to ${s.targetLang} (${s.currentTone} Mode)\`\n` +
        `${UI.divider}\n` +
        `⚡ Powered securely by Groq Llama Architecture.`;
    await ctx.reply(metricsReport, { parse_mode: "Markdown" });
});

bot.hears("🗑️ Clear Cache", async (ctx) => {
    const s = getUserSession(ctx.chat.id);
    s.lastInput = "";
    s.totalTranslations = 0;
    s.totalWordsProcessed = 0;
    await ctx.reply("🗑️ **Session Cache and Analytics wiped clean successfully.**", {
        reply_markup: makeMainKeyboard(s)
    });
});

bot.hears(/^🌐 Source:/, async (ctx) => {
    const s = getUserSession(ctx.chat.id);
    s.expectingText = false;
    s.settingLangType = "src";
    s.searchingLang = false;
    await ctx.reply("📥 **Select or search the Source (Input) Language:**", {
        reply_markup: makeLanguageKeyboard()
    });
});

bot.hears(/^🎯 Target:/, async (ctx) => {
    const s = getUserSession(ctx.chat.id);
    s.expectingText = false;
    s.settingLangType = "tgt";
    s.searchingLang = false;
    await ctx.reply("📤 **Select or search the Target (Output) Language:**", {
        reply_markup: makeLanguageKeyboard()
    });
});

bot.hears("🔍 Search Language", async (ctx) => {
    const s = getUserSession(ctx.chat.id);
    if (!s.settingLangType) {
        return ctx.reply("⚠️ Please select either **Source** or **Target** configuration button first.");
    }
    s.searchingLang = true;
    await ctx.reply("🔎 **Type the exact language name you want to search:**\n*(Examples: Burmese, Somali, Afar, Tamil, Korean, Arabic...)*", {
        reply_markup: new Keyboard().text("🔙 Back to Menu").resized()
    });
});

bot.hears("🔄 Quick Retry", async (ctx) => {
    const s = getUserSession(ctx.chat.id);
    if (!s.lastInput) return ctx.reply("⚠️ No text log found in session storage.");
    await executePipeline(ctx, s, s.lastInput);
});

// STABLE TRANSLATION RUNTIME PIPELINE
async function executePipeline(ctx, s, rawInput) {
    // Anti-Spam Rate Limiting Guard Feature
    const now = Date.now();
    if (now - s.lastRequestTime < 2000) {
        return ctx.reply("⚠️ **Rate Limit Triggered!** Please wait 2 seconds before sending next request.");
    }
    s.lastRequestTime = now;

    s.lastInput = rawInput;
    const loader = await ctx.reply("⚡ `Running high-accuracy premium tone translation pipeline...`", { parse_mode: "Markdown" });

    try {
        const systemPrompt = `You are an elite, production-grade automated language engine. 
Task: Translate the user's input content exactly from ${s.sourceLang} to ${s.targetLang} using an explicit delivery tone style framework.
Tone Setting: ${s.currentTone} Style. Adjust vocabulary, prose metrics, structure and context expressions strictly to reflect this design requirement without losing core semantic message intent.
Strict Directives:
- Provide ONLY the direct translation output string.
- Absolutely NO introductory phrases, explanations, meta notes, annotations, or system conversational updates.
- Retain exact structural spacing, line breaks, and punctuations flawlessly.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: rawInput }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.2
        });

        const cleanResult = chatCompletion.choices[0].message.content.trim();
        s.expectingText = false;

        // Analytics update math metrics calculations
        s.totalTranslations += 1;
        s.totalWordsProcessed += rawInput.split(/\s+/).filter(Boolean).length;

        const layoutResult = 
            `🌐 **[ ${s.sourceLang} ➔ ${s.targetLang} | Style: ${s.currentTone} ]**\n` +
            `${UI.bar}\n\n` +
            `${cleanResult}\n\n` +
            `${UI.bar}`;

        try { await ctx.api.deleteMessage(ctx.chat.id, loader.message_id); } catch (e) {}

        await ctx.reply(layoutResult, {
            parse_mode: "Markdown",
            reply_markup: makeMainKeyboard(s)
        });

    } catch (err) {
        console.error("Pipeline Runtime Exception:", err);
        try { await ctx.api.deleteMessage(ctx.chat.id, loader.message_id); } catch (e) {}
        await ctx.reply("❌ **Translation processing error.** Engine timeout or invalid sequence payload.", { reply_markup: makeMainKeyboard(s) });
    }
}

// DISPATCHER INCOMING MESSAGES
bot.on("message:text", async (ctx) => {
    const text = ctx.message.text.trim();
    if (text.startsWith("/")) return;

    const s = getUserSession(ctx.chat.id);

    // Language configuration handling
    if (s.settingLangType) {
        if (text === "🔍 Search Language" || text === "🔙 Back to Menu") return;

        // Button direct selection check
        if (!s.searchingLang && popularLanguages.flat().includes(text)) {
            if (s.settingLangType === "src") {
                s.sourceLang = text;
            } else {
                s.targetLang = text;
            }
            s.settingLangType = null;
            return ctx.reply(`✅ **Configuration confirmed:** Language updated.`, { reply_markup: makeMainKeyboard(s) });
        }

        // Text input validation search check
        if (s.searchingLang) {
            const lowercaseInput = text.toLowerCase();
            if (VALID_LANGUAGES.has(lowercaseInput)) {
                const standardizedName = text.charAt(0).toUpperCase() + text.slice(1);
                if (s.settingLangType === "src") {
                    s.sourceLang = standardizedName;
                } else {
                    s.targetLang = standardizedName;
                }
                s.settingLangType = null;
                s.searchingLang = false;
                return ctx.reply(`✅ **Search Match Found:** Selected \`${standardizedName}\``, {
                    parse_mode: "Markdown",
                    reply_markup: makeMainKeyboard(s)
                });
            } else {
                return ctx.reply("⚠️ **Invalid language.** That language is not recognized. Please type a valid real-world language name:");
            }
        }
    }

    // Standard Translation execution handling
    if (s.expectingText) {
        await executePipeline(ctx, s, text);
    } else {
        await ctx.reply("💡 **Notice:** Tap the **🔥 Translate Text** button to initiate processing.", {
            reply_markup: makeMainKeyboard(s)
        });
    }
});

bot.catch((err) => {
    console.error("Global Catch Error Handler Logged:", err);
});

bot.start();
console.log("🚀 Production Ready Premium Supercharged Feature Layout Live!");

