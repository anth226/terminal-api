import axios from "axios";
import "dotenv/config";

export async function processBillionaireSummary(billionaireId) {
  const url = `${process.env.AWS_EB_ENDPOINT_BOT}/billionaires/${billionaireId}/generate_summary?token=XXX`;

  try {
    const response = await axios.get(url);
    return { data: response.data };
  } catch (error) {
    console.log(error);
    return { data: null };
  }
}

export async function processWidgetInput(widgetInstanceId) {
  const url = `${process.env.AWS_EB_ENDPOINT_BOT}/widgets/${widgetInstanceId}/process_input?token=XXX`;

  try {
    const response = await axios.get(url);
    return { data: response.data };
  } catch (error) {
    console.log(error);
    return { data: null };
  }
}

export async function processUserPortfolio(portId) {
  const url = `${process.env.AWS_EB_ENDPOINT_BOT}/user_portfolios/${portId}/update?token=XXX`;

  try {
    const response = await axios.get(url);
    return { data: response.data };
  } catch (error) {
    console.log(error);
    return { data: null };
  }
}
