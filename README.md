<p align="center">
  <img src="icons/icon-48.png" alt="Teeto Logo" />
</p>

# TEETO: Web Application Data Scanner

## Overview
Teeto is a Chrome Extension designed to enhance web application security and development by scanning for and identifying endpoints, secrets, and parameters embedded within web applications.

## Features
Teeto offers a range of functionalities tailored for developers and security enthusiasts:
- **Web Page Scanning**: Automatically detects and lists endpoints, secrets, and parameters found in a web page.
- **Interactive UI**: Results are neatly displayed in the extension's user interface for easy review.
- **Cumulative Data Scanning**: Allows repeated scans across different sessions, accumulating and updating data.
- **Tab-Specific Data Storage**: Maintains separate data sets for each tab, ensuring domain-specific organization.
- **Data Export**: Provides options to download the found data or copy it to the clipboard for external use.

## Installation
To install Teeto on Chrome locally:
1. Clone the repository from GitHub: `git clone [repository-url]`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" at the top right corner.
4. Click on "Load unpacked" and select the cloned Teeto directory.
5. The Teeto icon should now appear in your browser toolbar.
   
You can directly install Teeto from the Chrome Web Store: [TEETO on Chrome Web Store](https://chromewebstore.google.com/detail/teeto/jkonpljnfkapenfc)

## Usage
Simply click on the Teeto icon in your browser toolbar and hit the 'Scan' button. Allow the extension to process the webpage data. Note: Do not close the extension during a scan as it may interrupt the process.

## Compatibility
Teeto is currently compatible exclusively with Google Chrome. It is particularly well-suited for medium to small-scale web applications, considering its optimized performance in environments with a smaller number of files.

## Troubleshooting
In cases where Teeto seems to be stuck during a scan, particularly on webpages with a large number of files, consider refreshing the page or restarting the scan. This issue typically arises due to the intensive nature of the scanning process on content-rich sites.

<!-- 
## License
[Include details about the license here. For example: This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.]
-->

## Contact
For support or feedback, please contact dodir.sec@gmail.com

<!-- 
## Acknowledgements
Special thanks to [Contributors/Supporters] for their contributions to this project.
-->
