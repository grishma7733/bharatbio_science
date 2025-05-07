document.addEventListener("DOMContentLoaded", async function () {
    try {
        // Extract product name from URL query string
        const urlParams = new URLSearchParams(window.location.search);
        const productName = urlParams.get("name"); // Get value of "name" param

        console.log("Extracted Product Name:", productName);

        if (!productName) {
            throw new Error("Invalid or missing product name");
        }
        
        const API_BASE_URL = "https://backendbharatbioscience-production.up.railway.app";
        const API_URL = `${API_BASE_URL}/api/product/${encodeURIComponent(productName)}`;

        console.log("Fetching product details from:", API_URL);

        

        
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const product = await response.json();

        if (!product || Object.keys(product).length === 0) {
            throw new Error("Product not found");
        }

        // Update HTML with product details
        document.getElementById("product-name").textContent = product.product_name || "N/A";
        document.getElementById("product-image").src = product.product_image_url || "default.jpg";
        document.getElementById("batch-no").textContent = product.batch_no || "N/A";
        document.getElementById("manufacturing-date").textContent = product.manufacturing_date.split('T')[0] || "N/A";
        document.getElementById("expiration-date").textContent = product.expiration_date.split('T')[0] || "N/A";
        // document.getElementById("mrp").textContent = product.mrp || "N/A";
        document.getElementById("registration-no").textContent = product.registration_no || "N/A";
        document.getElementById("manufacturer").textContent = product.manufacturer || "N/A";
        document.getElementById("marketed-by").textContent = product.marketed_by || "N/A";
        document.getElementById("cautionary-logo").src = product.cautionary_logo;
        document.getElementById("email").textContent = product.email || "N/A";
        document.getElementById("phone").textContent = product.phone_no || "N/A";
        document.getElementById("address").textContent = product.address || "N/A";

        document.getElementById("leaflet-link").href = product.leaflet_link || "#";
        document.getElementById("label-link").href = product.label_link || "#";

    } catch (error) {
        console.error("Error:", error);
        document.body.innerHTML = `<h2>Error loading product details</h2><p>${error.message}</p>`;
    }
});
