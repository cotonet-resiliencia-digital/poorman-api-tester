# Poorman - API Tester

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![PHP](https://img.shields.io/badge/php-%5E8.2-777BB4.svg)

**Poorman** is a lightweight, self-hosted API testing tool designed to be a simple, secure alternative to Postman. 

Built with **PHP** and **Vanilla JS**, it runs locally on your machine and uses a PHP Proxy to handle requests, bypassing common CORS issues found in browser-based API clients.

## 🚀 Features

* **Lightweight Frontend:** Built with Vanilla JS and CSS (no heavy frameworks like React or Vue).
* **CORS-Free Requests:** Uses a PHP backend proxy (cURL) to execute requests, allowing you to test any API endpoint.
* **Full HTTP Support:** GET, POST, PUT, DELETE, PATCH methods.
* **Smart Collections:** Save and organize your requests locally using Browser LocalStorage (no database required).
* **Detailed Debugging:** View response headers, body, and the raw request headers sent by the server.
* **Security by Design:**
    * **Public Folder Structure:** Application logic and dependencies (`vendor/`) are strictly isolated from the public web root.
    * **CSRF Protection:** Integrated token validation for all internal requests.

## 🛠️ Tech Stack

* **Backend:** PHP 8.2+ (Compatible with PHP 8.5)
* **Framework:** [Fat-Free Framework (F3)](https://fatfreeframework.com/) (Core only)
* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
* **Storage:** LocalStorage (Client-side)

## 📋 Prerequisites

* PHP >= 8.2
* Composer
* PHP cURL Extension enabled

## 📦 Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/poorman-api-tester.git](https://github.com/YOUR_USERNAME/poorman-api-tester.git)
    cd poorman-api-tester
    ```

2.  **Install dependencies:**
    This project uses Fat-Free Framework, which is installed via Composer.
    ```bash
    composer install
    ```

3.  **Start the Server:**
    You can use the included helper script to start a local development server rooted in the `public_html` folder.

    **Linux/Mac:**
    ```bash
    sh php_server.sh
    ```

    **Windows:**
    ```bash
    php -S localhost:1337 -t public_html
    ```

4.  **Access the App:**
    Open your browser and navigate to:
    `http://localhost:1337`

## 🔒 Security Architecture

This application follows the **"Public Folder"** pattern to prevent directory traversal and exposure of sensitive files.

* **`public_html/`**: The only directory accessible by the web server. Contains the entry point (`index.php`) and assets.
* **`app/`, `vendor/`, `composer.json`**: Located one level above the web root. These files cannot be accessed directly via a browser URL.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Developed by <a href="https://cotonet.pt" target="_blank"><strong>Cotonet</strong></a>
</p>