const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyDOGQxfBPXB1Khlhyci206FFnmema2ZLgw";
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        const models = await genAI.listModels();
        console.log("Available models:");
        models.models.forEach((m) => {
            console.log(`- ${m.name}: ${m.displayName} (v${m.version})`);
        });
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
