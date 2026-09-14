# 登记表

一个零依赖的纯前端表格应用。支持新增、编辑、删除记录，数据保存在浏览器本地的 IndexedDB 中，不需要后端服务。

## 功能

- 新增、编辑、删除登记记录
- 按姓名、状态、更新时间排序
- 按姓名、电话、邮箱、部门、备注搜索
- 每次修改和删除后自动写入 IndexedDB
- 导出当前筛选结果或全部记录为 CSV
- 支持电脑端和手机端布局

## 本地运行

浏览器对 `file://` 页面使用 IndexedDB 的限制不一致，建议通过本地 HTTP 服务打开。

在本目录执行：

```powershell
python -m http.server 8000
```

然后访问 <http://localhost:8000>。

如果没有 Python，也可以在 Visual Studio Code 中安装 Live Server 之类的静态服务器扩展。

## 数据存储

- 数据库名称：`registration-table`
- 对象仓库：`records`
- 数据只存在当前浏览器、当前访问地址对应的本地存储中
- 清除浏览器站点数据会同时清除登记记录
- 不同浏览器、不同设备之间不会自动同步

## 目录结构

```text
.
├── index.html
├── README.md
├── UPLOAD.md
├── .gitignore
├── .nojekyll
└── assets
    ├── css
    │   └── style.css
    └── js
        ├── db.js
        └── app.js
```

## 发布到 GitHub Pages

仓库上传完成后，在 GitHub 仓库页面进入：

`Settings` → `Pages` → `Build and deployment`

选择：

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

保存后，站点地址通常是：

`https://Xyu-7.github.io/work/`
