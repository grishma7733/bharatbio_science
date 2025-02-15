const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const QRCode = require('qrcode');
const fs = require('fs');
require('dotenv').config();

const app = express();
const localIP = "192.168.1.8";
app.use(express.static(path.join(__dirname, 'public')));
app.use('/view/product', express.static(path.join(__dirname, 'public')));



app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});



app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", 
        "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "script-src 'self'; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' http://localhost:4000 http://192.168.1.8:4000"
    );
    next();
});

const apiRouter = express.Router();

app.use('/images', express.static(path.join(__dirname, 'images')));

app.get("/", (req, res) => {
    res.send("Server is running! QR Code API is working.");
});

// ✅ Fixed Database Connection Issue
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
}).promise();

// ✅ Check if the database is connected
pool.getConnection()
    .then(() => console.log("[SUCCESS] Connected to Database"))
    .catch(err => console.error("[ERROR] Database connection failed:", err.message));

    app.get("/api/product/:id", async (req, res) => {
        const { id } = req.params;
        console.log(`[LOG] Received request for product ID: ${id}`);
        
        try {
            // Add proper error handling for the database query
            if (!id) {
                return res.status(400).json({ error: "Product ID is required" });
            }
    
            const [rows] = await pool.query(
                "SELECT * FROM product_details WHERE id = ?", 
                [id]
            );
            
            if (!rows || rows.length === 0) {
                console.log(`[LOG] No product found with ID: ${id}`);
                return res.status(404).json({ error: "Product not found" });
            }

             // ✅ If product exists, serve `product.html`
             res.sendFile(path.join(__dirname, "public", "index.html"));
    
            // Log the data being sent
            console.log("[LOG] Sending product data:", rows[0]);
            
            // Enable CORS for this route
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            
            // Send the product data
            res.json(rows[0]);
    
        } catch (err) {
            console.error("[ERROR] Database error:", err);
            res.status(500).json({ error: "Database error" });
        }
    });

    // ✅ API to fetch product data as JSON
app.get("/api/product/:id", async (req, res) => {
    const { id } = req.params;
    console.log(`[LOG] Received request for product ID: ${id}`);

    try {
        const [rows] = await pool.query("SELECT * FROM product_details WHERE id = ?", [id]);

        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: "Product not found" });
        }

        console.log("[LOG] Sending product data:", rows[0]);
        res.json(rows[0]);

    } catch (err) {
        console.error("[ERROR] Database error:", err);
        res.status(500).json({ error: "Database error" });
    }
});


    app.get("/view/product/:id", (req, res) => {
        const filePath = path.join(__dirname, "public", "index.html");
    
        console.log(`[LOG] Serving product page for ID: ${req.params.id}`);
        console.log(`[DEBUG] Looking for file at: ${filePath}`);
    
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error("[ERROR] Failed to serve product.html:", err);
                res.status(500).send(`Error loading product page: ${err.message}`);
            }
        });
    });
    

// ✅ Fixed QR Code Generation
app.get('/generate-qr/:id/save', async (req, res) => {
    const { id } = req.params;
    const qrUrl = `http://${localIP}:4000/view/product/${id}`;

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port http://${localIP}:${PORT}`));
