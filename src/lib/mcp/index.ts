import { defineMcp } from "@lovable.dev/mcp-js";
import listTodaysPredictions from "./tools/list-todays-predictions";
import listUpcomingPredictions from "./tools/list-upcoming-predictions";
import getPlatformAccuracy from "./tools/get-platform-accuracy";
import listNews from "./tools/list-news";
import listUpcomingMatches from "./tools/list-upcoming-matches";
import getExpertAnalysis from "./tools/get-expert-analysis";
import listTransferRumors from "./tools/list-transfer-rumors";
import listActiveContests from "./tools/list-active-contests";
import getNewsArticle from "./tools/get-news-article";
import getStreakLeaderboard from "./tools/get-streak-leaderboard";
import listValueBets from "./tools/list-value-bets";

export default defineMcp({
  name: "predictpro-mcp",
  title: "PredictPro MCP",
  version: "0.3.0",
  instructions:
    "PredictPro is an AI-powered sports prediction platform. Read tools cover today's and upcoming AI predictions (with confidence and reasoning), cached upcoming matches, in-depth expert analysis per match, platform accuracy stats, news articles (list + full content), transfer rumors, active prediction contests, streak leaderboards, and mathematically-derived value bets (edge/Kelly/EV vs bookmaker odds). All data is public/non-premium.",
  tools: [
    listTodaysPredictions,
    listUpcomingPredictions,
    listUpcomingMatches,
    getExpertAnalysis,
    getPlatformAccuracy,
    listNews,
    getNewsArticle,
    listTransferRumors,
    listActiveContests,
    getStreakLeaderboard,
    listValueBets,
  ],
});
