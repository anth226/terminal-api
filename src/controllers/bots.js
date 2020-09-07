import axios from "axios";

export async function processBillionaireSummary(billionaireId) {
  const url = `https://terminal-bot-staging.us-east-1.elasticbeanstalk.com//billionaires/${billionaireId}/generate_summary?token=XXX`;

  try {
    const response = await axios.get(url);
    return { data: response.data };
  } catch (error) {
    return { data: null };
  }
}
