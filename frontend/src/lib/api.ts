import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3500/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Ajoute automatiquement le token à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api