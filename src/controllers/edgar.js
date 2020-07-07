import axios from "axios";
import db from "../db";

import cheerio from "cheerio";

export async function lookupByName(name) {
  const url = "https://efts.sec.gov/LATEST/search-index";

  const data = { keysTyped: name };

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

export async function getSearchResults({
  sort = [],
  page = 0,
  size = 100,
  ...query
}) {
  return await db(`
    SELECT *
    FROM edgar_search_results
    ORDER BY titan_id ASC
    LIMIT ${size}
    OFFSET ${page * size}
  `);
}

const fetchPage = async (cik) => {
  let url = `https://www.sec.gov/edgar/search/#/dateRange=all&startdt=2000-01-01&enddt=2020-07-07&category=all&locationType=located&locationCode=all&ciks=${cik}`;

  console.log(url);

  try {
    const result = await axios.get(url);

    return cheerio.load(result.data);
  } catch (error) {
    return null;
  }
};

export async function parse() {
  let cik = "0001043298";

  const $ = await fetchPage(cik);

  let data = [];
  $("#collapseOne1 div.card-body table.table tr").each(function (idx, element) {
    data.push($(element).text());
  });

  console.log(data);

  console.log($("#collapseOne1").html());
}

{
  /* <div
  id="collapseOne1"
  class="collapse"
  role="tabpanel"
  aria-labelledby="headingOne1"
  data-parent="#accordionEx"
  style=""
>
  <div class="card-body facets" style="">
    <table class="table" facet="entity_filter">
      <tbody>
        <tr>
          {" "}
          <td>
            <a
              href="#0"
              data-filter-key="AMAZON COM INC  (AMZN)  (CIK 0001018724)"
              class="entity_filter ml-sm-2"
            >
              <span class="badge badge-secondary mr-2">155</span>
              <span class="link-text">
                AMAZON COM INC (AMZN) (CIK 0001018724)
              </span>
            </a>
          </td>
        </tr>
        <tr>
          {" "}
          <td>
            <a
              href="#0"
              data-filter-key="BEZOS JEFFREY P  (CIK 0001043298)"
              class="entity_filter ml-sm-2"
            >
              <span class="badge badge-secondary mr-2">155</span>
              <span class="link-text">BEZOS JEFFREY P (CIK 0001043298)</span>
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>; */
}
