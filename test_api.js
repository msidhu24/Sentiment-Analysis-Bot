import { fetchNewsData, fetchTwitterData, fetchTavilyData } from './src/services/api.js';

async function test() {
  console.log("Fetching News...");
  const n = await fetchNewsData('AAPL');
  console.log("News done.");
  console.log("Fetching Twitter...");
  const tw = await fetchTwitterData('AAPL');
  console.log("Twitter done.");
  console.log("Fetching Tavily...");
  const ta = await fetchTavilyData('AAPL');
  console.log("Tavily done.");
}
test().catch(console.error);
