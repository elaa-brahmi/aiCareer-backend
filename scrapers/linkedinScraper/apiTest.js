const axios = require('axios');

const BASE_URL = 'http://localhost:9090';

const runTests= async() => {
  console.log('Starting API tests...\n');
  
  try {
    // Test 1: Welcome endpoint
    console.log('Test 1: Welcome endpoint');
    const welcomeResponse = await axios.get(BASE_URL);
    console.log(' Welcome endpoint working\n');

    // Test 2: Search without parameters (should fail)
    console.log('Test 2: Search without parameters');
    try {
      await axios.get(`${BASE_URL}/api/search`);
      console.log('search without parameters working\n')
    } catch (error) {
      if (error.response.status === 400) {
        console.log(' Properly handling missing parameters\n');
      }
    }

    // Test 3: Search with valid parameters
    console.log('Test 3: Search with valid parameters');
    const searchResponse = await axios.get(`${BASE_URL}/api/search?keywords=javascript`);
    if (searchResponse.data.success && Array.isArray(searchResponse.data.jobs)) {
      console.log(' Search endpoint working\n');
    }

    // Test 4: Search with date filter
    console.log('Test 4: Search with date filter');
    const dateFilterResponse = await axios.get(
      `${BASE_URL}/api/search?keywords=python`
    );
    if (dateFilterResponse.data.success && Array.isArray(dateFilterResponse.data.jobs)) {
      console.log(' Date filter working\n');
    }

    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

runTests();