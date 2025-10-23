const axios = require('axios');

async function send(email) {
  try {
  const { data } = await axios.post('http://localhost:3060/api/auth/magic-link', { email });
    console.log('Success:', data);
  } catch (error) {
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
    } else {
      console.error('Request failed:', error.message);
    }
  }
}

send(process.argv[2]);
