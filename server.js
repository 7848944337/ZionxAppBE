const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const MOUSER_API_URL = 'https://api.mouser.com/api/v1/search/partnumber?apiKey=82675baf-9a58-4d5a-af3f-e3bbcf486560';
const ELEMENT14_API_URL = 'http://api.element14.com/catalog/products';
const ELEMENT14_API_KEY = 'wb9wt295qf3g6m842896hh2u';
const USD_TO_INR = 84;

app.post('/compare', async (req, res) => {
  const { partNumber, volume } = req.body;

  if (!partNumber || !volume) {
    return res.status(400).json({ error: 'Part number and volume are required.' });
  }

  try {
    const mouserPromise = axios.post(MOUSER_API_URL, {
      SearchByPartRequest: {
        mouserPartNumber: partNumber,
        partSearchOptions: 'string',
      },
    });

    const element14Promise = axios.get(ELEMENT14_API_URL, {
      params: {
        term: `manuPartNum:${partNumber}`,
        'storeInfo.id': 'in.element14.com',
        'resultsSettings.offset': 0,
        'resultsSettings.numberOfResults': 1,
        'resultsSettings.refinements.filters': 'inStock',
        'resultsSettings.responseGroup': 'medium',
        'callInfo.omitXmlSchema': false,
        'callInfo.callback': '',
        'callInfo.responseDataFormat': 'json',
        'callinfo.apiKey': ELEMENT14_API_KEY,
      },
    });

    const [mouserResponse, element14Response] = await Promise.all([mouserPromise, element14Promise]);

    // Process Mouser data
    const mouserParts = mouserResponse.data.SearchResults.Parts
      .filter(part => part.ManufacturerPartNumber === partNumber)
      .map(part => {
        const priceBreak = part.PriceBreaks.find(pb => pb.Quantity <= volume);
        const unitPrice = priceBreak ? parseFloat(priceBreak.Price.replace('₹', '')) : 0;
        const totalPrice = unitPrice * volume;

        return {
          manufacturerPartNumber: part.ManufacturerPartNumber,
          manufacturer: part.Manufacturer,
          dataProvider: 'Mouser',
          volume,
          unitPrice,
          totalPrice,
        };
      });

    // Process Element14 data
    const element14Products = element14Response.data.manufacturerPartNumberSearchReturn.products
      .filter(product => product.translatedManufacturerPartNumber === partNumber);
      
    const element14Parts = element14Products.map(product => {
      const priceBreak = product.prices.find(pb => pb.from <= volume);
      const unitPrice = priceBreak ? parseFloat(priceBreak.cost) * USD_TO_INR : 0;
      const totalPrice = unitPrice * volume;

      return {
        manufacturerPartNumber: product.translatedManufacturerPartNumber,
        manufacturer: product.vendorName,
        dataProvider: 'Element14',
        volume,
        unitPrice,
        totalPrice,
      };
    });

    // Combine results and sort by total price
    const results = [...mouserParts, ...element14Parts];
    results.sort((a, b) => a.totalPrice - b.totalPrice);

    res.json(results);
  } catch (error) {
    console.error('Error fetching data:', error.message || error);
    res.status(500).json({ error: 'Error fetching data from the server.', details: error.message || error });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
