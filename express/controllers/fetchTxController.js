import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const fetchTx = (req, res) => {
  const address = req.params.address;

  const requestOptions = {
    method: "get",
    url: "https://pro-api.solscan.io/v2.0/account/transactions",
    params: {
      address: address, // Use the address from the request parameters
      limit: "40",
    },
    headers: {
      token: process.env.SOLSCAN_API_KEY,
    },
  };

  axios
    .request(requestOptions)
    .then((response) => res.json(response.data))
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error fetching transactions");
    });
};

