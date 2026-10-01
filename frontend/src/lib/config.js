// Alamat backend. Default: host yang sama dengan yang dibuka di browser, port 8010.
// Jadi buka via http://10.129.48.62:5173 -> API otomatis ke http://10.129.48.62:8010
// Untuk override (mis. backend di server lain), isi VITE_API_URL di .env
export const API_ORIGIN =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:8010`;
