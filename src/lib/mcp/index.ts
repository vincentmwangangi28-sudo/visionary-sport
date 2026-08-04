import { auth, defineMcp } from "@lovable.dev/mcp-js";
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

// The OAuth issuer must be the direct Supabase auth host, built from the project
// ref (inlined by Vite at build time so the entry stays import-safe).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "visionary-sport",
  title: "visionary-sport",
  version: "0.4.0",
  instructions:
    "PredictPro is an AI-powered sports prediction platform. Callers sign in as a user of this app, so tools act as that user and row-level security applies. Read tools cover today's and upcoming AI predictions (with confidence and reasoning), cached upcoming matches, in-depth expert analysis per match, platform accuracy stats, news articles (list + full content), transfer rumors, active prediction contests, the signed-in user's streak stats, and mathematically-derived value bets (edge/Kelly/EV vs bookmaker odds).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),

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
