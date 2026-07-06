import { defineMcp } from "@lovable.dev/mcp-js";
import listTodaysPredictions from "./tools/list-todays-predictions";
import listUpcomingPredictions from "./tools/list-upcoming-predictions";
import getPlatformAccuracy from "./tools/get-platform-accuracy";
import listNews from "./tools/list-news";

export default defineMcp({
  name: "predictpro-mcp",
  title: "PredictPro MCP",
  version: "0.1.0",
  instructions:
    "PredictPro is an AI-powered sports prediction platform. Use these tools to read today's and upcoming AI football/sports predictions (with confidence scores and reasoning), platform accuracy statistics, and recent news articles. All results are public/non-premium data.",
  tools: [listTodaysPredictions, listUpcomingPredictions, getPlatformAccuracy, listNews],
});
