/* eslint-disable linebreak-style */
const axios = require('axios');

const params = {
  access_key: '4411bda3224f2846161281ea20c276a6',
};

axios
  .get('https://api.aviationstack.com/v1/flights', { params })
  .then((response) => {
    const apiResponse = response.data;
    if (Array.isArray(apiResponse.results)) {
      apiResponse.results.forEach((flight) => {
        if (!flight.live.is_ground) {
          //   console.log(
          //     `${flight["airline"]["name"]} flight ${flight["flight"]["iata"]}`,
          //     `from ${flight["departure"]["airport"]} (${flight["departure"]["iata"]})`,
          //     `to ${flight["arrival"]["airport"]} (${flight["arrival"]["iata"]}) is in the air.`
          //   );
        }
      });
    }
  })
  .catch((error) => {
    console.error(error);
  });
