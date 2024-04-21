<h1 style="text-align: center;">AutoLeet</h1>
<small style="display: flex; justify-content: center">An open source chrome extension that takes your code and shares on preferred social media</small>

### Installation

```bash
sudo apt install git -y
git clone https://github.com/israfil-miya/autoleet.git
cd autoleet
sudo apt install nodejs
sudo apt install npm
npm i
npm run build
```

### Setup

- Open Chrome browser (should work in any chromium browser)
- Go to `chrome://extensions`
- Enable the `Developer mode` toggle
- Click on `Load unpacked`
- Select the download `autoleet` folder (root)

### Usage

- Go to `leetcode.com` and open any problem
  <img src="https://i.ibb.co/Tb5nZ4R/step-1.png" alt="step-1" width="80%" height="auto">
- Solve the problem and submit your answer then go to your submission from the `Submissions` tab
  <img src="https://i.ibb.co/RQv7Hmp/step-2.png" alt="step-2" width="80%" height="auto">

- Select the code you want to share
  <img src="https://i.ibb.co/Vtxstfv/step-3.png" alt="step-3" width="80%" height="auto">

- Right click on the selection and choose `Share to social media`
  <img src="https://i.ibb.co/rvpKv4m/step-4.png" alt="step-4" width="80%" height="auto">

- Fill-up the form in the popup and click the `Submit` button
  <img src="https://i.ibb.co/DQRTRpM/step-5.png" alt="step-5" width="80%" height="auto">
  <p style="font-size: 0.9rem"><b>Note:</b> Language, Title & Caption is auto generated but it's editable</p>

<br/>

> The extension will then open `ray.so` website in a new tab, generate the code block image from the selected text/code and then download it automatically. When the download finishes the extension will open `facebook.com` in a new tab and you will redirected to that tab. The extension will then automatically trigger the facebook's `Create Post` popup and fill-in Caption & Image and then post it.

> _Make sure you are logged in to `facebook.com` before using the extension_
