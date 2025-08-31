// Simple Angular HTTP test to verify template loading
// This mimics what the LocalCardConfigurationService does

const baseUrl = 'http://localhost:4200';
const cardTypeToId = {
  'company': 'dsm-company',
  'contact': 'monica-contact',
  'opportunity': 'enterprise-opp',
  'product': 'ics-product',
  'analytics': 'analytics-interest',
  'event': 'qbr-event'
};

async function testTemplateLoading() {
  console.log('🧪 Testing template loading...');
  
  for (const [cardType, id] of Object.entries(cardTypeToId)) {
    const variant = 1;
    const filename = `${id}.variant${variant}.json`;
    const url = `${baseUrl}/assets/cards/demo/${filename}`;
    
    try {
      console.log(`📋 Testing ${cardType} template: ${url}`);
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${cardType}: "${data.cardTitle}" (${data.cardType}) - ${data.sections.length} sections`);
      } else {
        console.error(`❌ ${cardType}: HTTP ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ ${cardType}: ${error.message}`);
    }
  }
  
  console.log('🏁 Template loading test complete');
}

// Run the test
testTemplateLoading();
