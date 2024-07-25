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
const RUTRONIK24_API_URL = 'https://www.rutronik24.com/api/search/';
const USD_TO_INR = 84;
const EUR_TO_INR = 90;
app.post('/compare', async (req, res) => {
  const { partNumber, volume } = req.body;

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

    const rutronik24Promise = axios.get(RUTRONIK24_API_URL, {
      params: {
        apikey: 'cc6qyfg2yfis',
        searchterm: partNumber,
      },
    });

    const [mouserResponse, element14Response, rutronik24Response] = await Promise.all([mouserPromise, element14Promise, rutronik24Promise]);

    // Process Mouser data
const mouserParts = mouserResponse.data.SearchResults.Parts
  .filter(part => part.ManufacturerPartNumber === partNumber)
  .map(part => {
   
    const priceBreak = part.PriceBreaks
      .slice() 
      .sort((a, b) => b.Quantity - a.Quantity) // Sort in descending order by quantity
      .find(pb => pb.Quantity <= volume);
    
   
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
    const element14Products = element14Response.data.manufacturerPartNumberSearchReturn.products;
const element14Parts = element14Products
  .filter(product => product.translatedManufacturerPartNumber === partNumber)
  .map(product => {
    // Find the price break where the volume falls within the 'from' and 'to' range
    const priceBreak = product.prices
      .filter(pb => pb.from <= volume && pb.to >= volume) 
      .sort((a, b) => a.from - b.from) 
      .pop(); 

    // Calculate unit price based on the found price break
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
  })
  .sort((a, b) => a.unitPrice - b.unitPrice) // Sort by unit price in ascending order
  .slice(0, 1); 
    


    // Process Rutronik24 data
    const rutronik24Parts = rutronik24Response.data
    .filter(product => product.mpn === partNumber)
    .map(product => {
      // Filter price breaks where quantity is <= volume
      const applicablePriceBreaks = product.pricebreaks
        .filter(pb => pb.quantity <= volume)
        .sort((a, b) => b.quantity - a.quantity);
      const priceBreak = applicablePriceBreaks.length > 0
        ? applicablePriceBreaks[0]
        : product.pricebreaks[0]; // Default to the lowest price break
  
      const unitPrice = parseFloat(priceBreak.price) * EUR_TO_INR;
      const totalPrice = unitPrice * volume;
  
      return {
        manufacturerPartNumber: product.mpn,
        manufacturer: product.manufacturer,
        dataProvider: 'Rutronik24',
        volume,
        unitPrice,
        totalPrice,
      };
    });
  

    // Combine results and sort by total price
    const results = [...mouserParts, ...element14Parts,...rutronik24Parts];
    results.sort((a, b) => a.totalPrice - b.totalPrice);

    res.json(results);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Error fetching data from the server.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
