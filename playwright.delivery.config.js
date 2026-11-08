const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({testDir:'./browser-tests',testMatch:'delivery.spec.js',timeout:30000,workers:1,use:{baseURL:'http://127.0.0.1:4184',viewport:{width:390,height:844},serviceWorkers:'allow',launchOptions:{args:['--enable-unsafe-swiftshader']},screenshot:'only-on-failure'},reporter:'list'});
