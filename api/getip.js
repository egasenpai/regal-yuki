export default async function handler(req, res) {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    res.status(200).json({ ip_vercel: data.ip });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

