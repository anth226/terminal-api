import axios from "axios";

export async function processBillionaireSummary(billionaireId) {
  const url = `http://terminal-bot-staging.us-east-1.elasticbeanstalk.com/billionaires/${billionaireId}/generate_summary?token=XXX`;

  try {
    const response = await axios.get(url);
    return { data: response.data };
  } catch (error) {
    console.log(error);
    return { data: null };
  }
}

export async function processWidgetInput(widgetInstanceId) {
  const url = `http://terminal-bot-staging.us-east-1.elasticbeanstalk.com/widgets/${widgetInstanceId}/process_input?token=XXX`;

  try {
    const response = await axios.get(url);
    return { data: response.data };
  } catch (error) {
    console.log(error);
    return { data: null };
  }
}
