async function test() {
  try {
    const loginRes = await fetch('http://localhost:5001/api/accounts/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({username: 'admin', password: '123456'})
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    
    // get feedbacks
    const fbRes = await fetch('http://localhost:5001/api/feedbacks', { 
        headers: { Authorization: 'Bearer ' + token } 
    });
    const feedbacks = await fbRes.json();
    console.log('Feedbacks count:', feedbacks.length);
    if (feedbacks.length > 0) {
      const fb = feedbacks[0];
      console.log('Testing update on feedback:', fb.feedbackId);
      
      const updateRes = await fetch(`http://localhost:5001/api/feedbacks/${fb.feedbackId}/status`, { 
        method: 'PATCH',
        headers: { 
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'Approved' })
      });
      const updateData = await updateRes.json();
      console.log('Update res:', updateData);
    }
  } catch(e) {
    console.log(e.message);
  }
}
test();
