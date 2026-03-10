import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// User
export const createUser = () => api.post('/users').then(r => r.data)
export const getUser = (id) => api.get(`/users/${id}`).then(r => r.data)
export const updateUser = (id, data) => api.patch(`/users/${id}`, data).then(r => r.data)

// Messages
export const getMessages = (userId) => api.get(`/users/${userId}/messages`).then(r => r.data)
export const deleteMessages = (userId) => api.delete(`/users/${userId}/messages`).then(r => r.data)

// Selections
export const getSelections = (userId) => api.get(`/users/${userId}/selections`).then(r => r.data)
export const saveSelection = (userId, data) => api.post(`/users/${userId}/selections`, data).then(r => r.data)

// AI
export const sendChat = (payload) => api.post('/chat', payload).then(r => r.data)
export const extractStructured = (prompt) => api.post('/extract', { prompt }).then(r => r.data)
export const getTips = (prompt) => api.post('/tips', { prompt }).then(r => r.data)
