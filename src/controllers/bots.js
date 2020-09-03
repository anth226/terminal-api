import axios from "axios";

export async function processBillionaireSummary(billionaireId) {
  // Set up queue for summary recalculation.

  const url = "https://terminal-bot-staging.us-east-1.elasticbeanstalk.com/";

  const data = { billionaireId };

  try {
    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return { data: response.data };
  } catch (error) {
    return { data: null };
  }
}
