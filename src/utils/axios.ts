import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { errorInterceptor, successInterceptor } from './interceptors';
import { API_URL } from '@/config/config';

const axiosRequestConfig: AxiosRequestConfig = {
  baseURL: API_URL,
  responseType: 'json',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  },
};

export const api: AxiosInstance = axios.create(axiosRequestConfig);

api.interceptors.response.use(successInterceptor, errorInterceptor);

export { axios };
