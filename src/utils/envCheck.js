export const checkEnvironment = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  console.log('Environment Check:');
  console.log('VITE_API_URL:', apiUrl);
  console.log('Current URL:', window.location.href);
  console.log('Current pathname:', window.location.pathname);
  
  if (!apiUrl) {
    console.error('VITE_API_URL is not set! This will cause API calls to fail.');
    return false;
  }
  
  return true;
}; 