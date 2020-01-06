yapi-plugin-auto-test
===

在分组的项目导航栏中加入*自动化测试*标签，支持直接在项目中设置服务端测试计划。

## 安装

第一步：在config.json 这层目录下运行 ```yapi plugin --name yapi-plugin-auto-test```   安装插件  

第二步： 重启服务器

## 使用

### 测试计划
用户可以自定义多个测试计划，根据对应的设置项进行测试计划的设置。

自定义通知目前只支持企业微信通知，如果url为空则不发送通知，邮件通知不受触发通知影响。

### 测试结果
时间轴风格的测试结果列表，支持直接查看历史测试结果。注意：测试结果页面的清空会直接**清空**当前计划的历史测试结果，谨慎操作。

## 更新
通过yapi-cli更新插件还是比较麻烦的，直接再执行一次命令并不会更新。因为yapi-cli安装插件实际上就是在vendors目录下执行`npm install  --registry https://registry.npm.taobao.org yapi-plugin-auto-test`，所以最后会在package.json文件中记录下开始安装的版本号，再次执行安装的还是同一个版本。

执行如下操作可以进行更新：
1. 需要先清除ykit的缓存，删除`./vendors/node_modules/.ykit_cache`文件夹
2. 修改package.json里面`yapi-plugin-auto-test`的版本或者直接`npm i yapi-plugin-auto-test@version`
3. 在`./vendors/`目录中执行命令`NODE_ENV=production ykit pack -m`
4. 执行命令`yapi plugin --name yapi-plugin-auto-test`后再重启服务器就完成安装指定版本的插件



## ChangeLog

### v0.0.2

* 新增自定义通知，支持企业微信通知
* 为保证token安全，从测试结果通知中移除token