# 上传到 GitHub 的顺序

目标仓库：

`https://github.com/Xyu-7/work`

本机没有安装 Git，也没有 GitHub CLI，所以无法直接推送。可以按下面的顺序使用 GitHub 网页端手动上传。

## 推荐方式：一次上传全部

1. 打开仓库页面：<https://github.com/Xyu-7/work>
2. 点击 `Add file` → `Upload files`
3. 把本目录中的 `index.html`、`README.md`、`UPLOAD.md`、`.gitignore`、`.nojekyll` 和 `assets` 文件夹一起拖入上传区域
4. 确认页面上出现完整的 `assets/css/style.css`、`assets/js/db.js`、`assets/js/app.js` 路径
5. 在提交说明中填写 `Initial registration table app`
6. 点击 `Commit changes`

GitHub 网页端支持拖入文件夹并保留目录结构。

## 分步上传顺序

如果一次拖入不方便，按下面四批上传。

### 第 1 批：入口和说明

1. `index.html`
2. `README.md`
3. `UPLOAD.md`

### 第 2 批：仓库配置

1. `.gitignore`
2. `.nojekyll`

这两个文件是隐藏文件，Windows 资源管理器可能默认不显示。可以在资源管理器的“查看”菜单中勾选“隐藏的项目”。

### 第 3 批：样式

1. 新建或上传 `assets/css/style.css`

GitHub 网页端拖入 `assets` 文件夹时会自动保留路径，因此通常不需要手动建目录。

### 第 4 批：程序逻辑

1. `assets/js/db.js`
2. `assets/js/app.js`

## 上传后的检查

仓库根目录应包含：

```text
index.html
README.md
UPLOAD.md
.gitignore
.nojekyll
assets/css/style.css
assets/js/db.js
assets/js/app.js
```

打开 <https://github.com/Xyu-7/work> 后，确认 `assets` 文件夹存在，并且里面的路径与上面一致。
