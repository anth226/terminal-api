import axios from 'axios';
import cheerio from 'cheerio';


export async function getCreditCardList(url)  {
    const result = await axios.get(url);
    const $ = await cheerio.load(result.data);
    let cards = []
    $('table.B6cJf').first().find("tbody tr").each(function(idx, element) {
      const card = {
        name: $(element).find(".creditCard p").text(),
        best_for: $(element).find(".bestFor p").text(),
        reward_rate: $(element).find(".rewardRate p._1fK_i").text(),
        intro_offer: $(element).find(".introOffer p._1fK_i").text(),
        annual_fee: $(element).find(".annualFee p").first().text(),
      }
      cards.push(card)
    })

    return cards

}

export async function getAllCards()  {
  /*
  const cardData = {
    rewards: await getCreditCardList("https://www.nerdwallet.com/best/credit-cards/rewards"),
    cash_back: await getCreditCardList("https://www.nerdwallet.com/best/credit-cards/cash-back"),
    travel: await getCreditCardList("https://www.nerdwallet.com/best/credit-cards/travel"),
    balance_transfer: await getCreditCardList("https://www.nerdwallet.com/best/credit-cards/balance-transfer"),
    low_interest: await getCreditCardList("https://www.nerdwallet.com/best/credit-cards/low-interest"),
    college_student: await getCreditCardList("https://www.nerdwallet.com/best/credit-cards/college-student"),
    bad_credit: await getCreditCardList("https://www.nerdwallet.com/best/credit-cards/bad-credit"),
  }
*/

  const cardData = await getCreditCardList("https://www.nerdwallet.com/best/credit-cards/bad-credit");
  console.log(cardData);

}










//
// export async function getAllCards()  {
//   let cardResults = {}
//   Object.keys(creditCardEndpoints).forEach(function(key) {
//     console.log(key);
//     const url = creditCardEndpoints[key];
//     const cards = getCreditCardList(url).then(data => data);
//     cardResults[key] = cards;
//   });
//   console.log(cardResults);
// }
