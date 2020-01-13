import axios from 'axios';
import * as csv from 'csvtojson';

export async function getSectorsPerformance()  {
  const url = "https://finviz.com/grp_export.ashx?g=sector&v=140&o=name";
  const body = await axios.get(url);
  const result = await csv.csv().fromString(body.data)
  return result;
}

export async function getIndustriesPerformance()  {
  const url = "https://finviz.com/grp_export.ashx?g=industry&v=140&o=name";
  const body = await axios.get(url);
  const result = await csv.csv().fromString(body.data)
  return result;
}
