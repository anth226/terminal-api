import axios from "axios";

export async function subscribeToList(email) {
  let url = `${process.env.KLAVIYO_BASE_PATH}/api/v2/list/${process.env.KLAVIYO_LIST_ID}/subscribe?api_key=${process.env.KLAVIYO_API_KEY}`;


  const data = {
    profiles: [    
      {
        email: email
      }
    ] 
  };

  try {
  
    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
      }
    });

    return response.data;
  } catch (error) {
    return {};
  }
}
