<h1 style="text-align: center;">AutoLeet</h1>
<small style="display: flex; justify-content: center">An open source chrome extension that takes your code, creates a beautiful image from your code snippet and posts on facebook</small>

### Installation (Debian Linux)

```sh
sudo apt install git -y
git clone https://github.com/israfil-miya/autoleet.git
cd autoleet
sudo apt install nodejs -y
sudo apt install npm -y
npm i
npm run build
```

### Setup

- Open Chrome browser (should work in any chromium browser)
- Go to `chrome://extensions`
- Enable the `Developer mode` toggle
- Click on `Load unpacked`
- Select the downloaded `autoleet` folder (root)

### Configure

#### Professional Mode:

- Open `/src/script/background.ts` file
- Set the `professionalAccount` variable as `true` if you have professional mode enabled for your Facebook account.
- Default: `true`

#### Confirmation Before Posting:

- Open `/src/script/background.ts` file
- Set the `requireConfirmationBeforePosting` variable as `true` if you want a confirmation before clicking the post button.
- Default: `true`

#### Waiting Time After Confirmation:

- Open `/src/script/background.ts` file
- Set the wait time in seconds in `countdownAfterConfirmationInSeconds` variable.
- You can set the variable to `0` for no waiting.
- Default: `5`

### Usage

- Go to `leetcode.com` and open any problem
  <img src="https://i.ibb.co/Tb5nZ4R/step-1.png" alt="step-1" width="80%" height="auto">

- Solve the problem and submit your answer
  <img src="https://i.ibb.co/RQv7Hmp/step-2.png" alt="step-2" width="80%" height="auto">

- Select the part of the code you want to share
  <img src="https://i.ibb.co/Vtxstfv/step-3.png" alt="step-3" width="80%" height="auto">

- Right click on the selection and choose `Share to social media`
  <img src="https://i.ibb.co/rvpKv4m/step-4.png" alt="step-4" width="80%" height="auto">

- Fill-up the form in the popup and click the `Submit` button
  <img src="https://i.ibb.co/DQRTRpM/step-5.png" alt="step-5" width="80%" height="auto">
  <p style="font-size: 0.9rem"><b>Note:</b> Language, Title & Caption is auto generated but it's editable</p>

### Flow

- The extension opens [ray.so](https://ray.so/), generates the code block image, and downloads it automatically.
- After download, it opens [facebook.com](https://www.facebook.com/), fills in the caption and image, and posts.

### Notes

- Ensure you're logged in to Facebook before using the extension.
