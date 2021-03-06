# Food Cub

This Chrome extension will highlight products with ingredients that you do not want on Food Lion's website (product browse pages). The purpose of this is to help make shopping easier for people with allergies. It will also work with Aldi's website.

## Usage

Simply enter products seperated with newlines in the text box that appears when you click the Food Cub extension icon. Once you've done this, Food Lion's products will have a slight red tint if they contain one of the products that you listed. Works with https://shop.foodlion.com and https://shop.aldi.us/. You will have to refresh the page after making a change to your list. To allow an ingredient that perhaps contains an ingredient you want, type a `^` character before it. So to allow almond milk but disallow milk, your list would be:
```
milk
^almond milk
```

## Setup

1. Download and extract this repo.
2. Open Chrome or your Chromium browser.
3. Navigate to `chrome://extensions`.
4. Enable Developer mode in the top right corner.
5. Click "Load unpacked" and select the extracted folder.