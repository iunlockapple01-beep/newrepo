export default function handler(req, res) {
  console.log("Telegram webhook hit");

  res.status(200).json({ message: "OK" });
}
