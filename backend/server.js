const express = require('express');
const { Client } = require('pg');
const cors = require('cors');
const path = require('path');
const QRCode = require('qrcode');
const fs = require('fs');
require('dotenv').config();

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "https://bharatbio-science.vercel.app";
app.use(express.static(path.join(__dirname, 'public')));

const apiRoutes = require("./routes/apiRoutes"); // Ensure this matches the correct file path
app.use("/api", apiRoutes);




app.use(express.json());

app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", 
        "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "script-src 'self'; " +
        "img-src 'self' data: https:; " +
        `connect-src 'self' ${FRONTEND_URL} ${process.env.BACKEND_URL};`
    );
    next();
});

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/qrcodes', express.static('qrcodes'));

app.get("/", (req, res) => {
    res.send("Server is running! QR Code API is working.");
});

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

client.connect()
    .then(() => console.log('Connected to Supabase Database'))
    .catch(err => console.error('Connection error', err.stack));

    app.get("/api/product/:id", async (req, res) => {
        const { id } = req.params;
        console.log(`[LOG] Received request for product ID: ${id}`);
    
        try {
            const result = await client.query("SELECT * FROM product_details WHERE id = $1", [id]);
            const rows = result.rows;
    
            if (!rows || rows.length === 0) {
                return res.status(404).json({ error: "Product not found" });
            }
    
            const product = rows[0];
            const response = {
                product_name: product.name,
                product_image_url: product.image_url,
                batch_no: product.batch_no,
                manufacturing_date: product.manufacturing_date,
                expiration_date: product.expiration_date,
                mrp: product.mrp,
                registration_no: product.registration_no,
                manufacturer: product.manufacturer,
                marketed_by: product.marketed_by,
                antidote_statement: product.antidote_statement,
                email: product.email,
                phone_no: product.phone_no,
                address: product.address,
                leaflet_link: product.leaflet_link,
                label_link: product.label_link
            };
    
            console.log("[LOG] Sending product data:", response);
            res.json(response);
    
        } catch (err) {
            console.error("[ERROR] Database error:", err);
            res.status(500).json({ error: "Database error" });
        }
    });
    app.get("/view/product/:id", async (req, res) => {
        const { id } = req.params;
        console.log(`[LOG] Received request for product ID: ${id}`);
    
        try {
            const result = await client.query("SELECT * FROM product_details WHERE id = $1", [id]);
            const rows = result.rows;
    
            if (!rows || rows.length === 0) {
                return res.status(404).json({ error: "Product not found" });
            }
    
            console.log("[LOG] Redirecting to frontend for product ID:", id);
            res.redirect(`${FRONTEND_URL}/view/product/${id}`);
    
        } catch (err) {
            console.error("[ERROR] Database error:", err);
            res.status(500).json({ error: "Database error" });
        }
    });

    app.get('/api/generate-qr/:id/save', async (req, res) => {
        const { id } = req.params;
        const qrUrl = `${FRONTEND_URL}/view/product/${id}`;
    
        try {
            const qrCode = await QRCode.toDataURL(qrUrl);
            const qrCodesDir = path.join(__dirname, 'qrcodes');
    
            if (!fs.existsSync(qrCodesDir)) fs.mkdirSync(qrCodesDir, { recursive: true });
    
            const filePath = path.join(qrCodesDir, `qrcode_${id}.png`);
            const base64Data = qrCode.replace(/^data:image\/png;base64,/, "");
            fs.writeFileSync(filePath, base64Data, 'base64');
    
            console.log("[LOG] QR Code saved at:", filePath);
            res.json({ message: "QR Code saved!", file: `/qrcodes/qrcode_${id}.png` });
    
        } catch (err) {
            console.error("[ERROR] QR Code Generation Failed:", err.message);
            res.status(500).json({ error: `QR Code generation failed: ${err.message}` });
        }
    });

// app.get("*", (req, res, next) => {
//     if (req.path.startsWith("/api")) {
//         return res.status(404).json({ error: "API route not found" });
//     }
//     res.sendFile(path.join(__dirname, "public", "index.html"));
// })

const PORT = process.env.PORT || 3998;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));