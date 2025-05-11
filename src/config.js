import axios from 'axios';

export const API_BASE_URL = 'http://45.77.252.39:8001';
export const TOKEN = '6f50f263845274bb4faf07d11f1b30c3ac209710';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Token ${TOKEN}`,
    'Content-Type': 'application/json'
  }
});

