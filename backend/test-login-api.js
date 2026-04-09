const axios = require('axios');

async function testLogin() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'csrkurupudi2005@gmail.com',
      password: 'charan'
    });
    console.log('Login Success:', res.data.token ? 'YES' : 'NO');
    console.log('User Role:', res.data.user.role);
  } catch (err) {
    console.log('Login Failed:', err.response?.data?.message || err.message);
  }
}

testLogin();
