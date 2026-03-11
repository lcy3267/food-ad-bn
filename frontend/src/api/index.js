import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// User
export const createUser = () => api.post('/users').then(r => r.data)
export const getUser = (id) => api.get(`/users/${id}`).then(r => r.data)
export const updateUser = (id, data) => api.patch(`/users/${id}`, data).then(r => r.data)

// Chat: history + single entry point
export const getMessages = (userId) => api.get(`/users/${userId}/messages`).then(r => r.data)
export const postChat = (payload) => api.post('/chat', payload).then(r => r.data)
