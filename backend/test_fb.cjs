const axios = require('axios');
async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5001/api/accounts/login', {username: 'admin', password: '123456'});
    const token = loginRes.data.token;
    
    // get feedbacks
    const fbRes = await axios.get('http://localhost:5001/api/feedbacks', { headers: { Authorization: 'Bearer ' + token } });
    console.log('Feedbacks count:', fbRes.data.length);
    if (fbRes.data.length > 0) {
      const fb = fbRes.data[0];
      console.log('Testing update on feedback:', fb.feedbackId);
      
      const updateRes = await axios.patch(`http://localhost:5001/api/feedbacks/${fb.feedbackId}/status`, { status: 'Approved' }, { headers: { Authorization: 'Bearer ' + token } });
      console.log('Update res:', updateRes.data);
    } else {
        console.log('No feedbacks found. Creating one...');
        // Need a customer and product to create a feedback.
    }
  } catch(e) {
    console.log(e.response ? e.response.data : e.message);
  }
}
test();
