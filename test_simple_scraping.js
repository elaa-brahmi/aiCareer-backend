/* const axios = require('axios');

const BASE_URL = 'http://localhost:9090';

async function testSimpleScraping() {
  console.log('=== TESTING AUTOMATIC JOB SCRAPING FOR ALL CATEGORIES ===\n');
  
  try {
    // Test: Automatic scraping of all job categories from JSON
    console.log('🚀 Testing automatic scraping of ALL job categories...');
    console.log('   This will automatically scrape jobs for all categories:');
    console.log('   - tech, data, cybersecurity, cloud, design, qa, product');
    console.log('   - finance, marketing, healthcare, education, manufacturing');
    console.log('   - hr, legal, entry');
    console.log('   No keywords parameter needed - it scrapes everything!');
    
    const response = await axios.get(`${BASE_URL}/api/scrape/linkedin`);
    console.log(`\n📊 Results:`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Categories processed: ${response.data.categoriesProcessed || 0}`);
    console.log(`   Keywords processed: ${response.data.keywordsProcessed || 0}`);
    console.log(`   Total jobs found: ${response.data.count || 0}`);
    console.log(`   Message: ${response.data.message}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testSimpleScraping().then(() => {
  console.log('\n=== TEST COMPLETE ===');
}).catch(error => {
  console.error('Test execution failed:', error);
});
 */