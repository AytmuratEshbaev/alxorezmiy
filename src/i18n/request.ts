import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => ({ locale: 'uz', messages: {} }));
