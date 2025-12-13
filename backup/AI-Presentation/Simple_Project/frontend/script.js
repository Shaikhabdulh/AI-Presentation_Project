document.addEventListener("DOMContentLoaded", () => {
  const productForm = document.getElementById("add-product-form");
  const searchInput = document.getElementById("search-input");
  const productList = document.getElementById("product-list");

  // Function to fetch and display products
  const fetchProducts = async (searchTerm = "") => {
    try {
      const response = await fetch(
        `api.php${searchTerm ? "?search=" + searchTerm : ""}`
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const products = await response.json();
      displayProducts(products);
    } catch (error) {
      productList.innerHTML = `<p>Error fetching products: ${error.message}</p>`;
    }
  };

  // Function to display products in the DOM
  const displayProducts = (products) => {
    productList.innerHTML = ""; // Clear current list
    if (products.length === 0) {
      productList.innerHTML = "<p>No products found.</p>";
      return;
    }
    products.forEach((product) => {
      const productElement = document.createElement("div");
      productElement.classList.add("product-item");
      productElement.innerHTML = `
                <div class="product-details">
                    <h3>${product.name}</h3>
                    <p>${product.description || "No description"}</p>
                    <p>Price: $${parseFloat(product.price || 0).toFixed(2)}</p>
                </div>
                <div class="product-quantity">
                    Quantity: ${product.quantity}
                </div>
            `;
      productList.appendChild(productElement);
    });
  };

  // Handle form submission
  productForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      name: document.getElementById("name").value,
      quantity: document.getElementById("quantity").value,
      description: document.getElementById("description").value,
      price: document.getElementById("price").value,
    };

    try {
      const response = await fetch("api.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        productForm.reset();
        fetchProducts(); // Refresh the list
      } else {
        alert("Error: " + result.message);
      }
    } catch (error) {
      alert("Error adding product: " + error.message);
    }
  });

  // Handle search input
  searchInput.addEventListener("input", (e) => {
    fetchProducts(e.target.value);
  });

  // Initial fetch to load all products
  fetchProducts();
});
