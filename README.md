# Tina 3D Tesla

中英双语的 **2021 款 Tesla Model Y 3D 交互与结构探索网站**。旋转、缩放、渐进视觉展开、分类、高亮与单件隔离均在浏览器中运行，无需数据库、账号或 AI API。

An independent bilingual Model Y 3D exploration studio built with React, TypeScript and Three.js. AI assisted development; no runtime AI service is needed.

**在线体验 / Live:** [tina-3d-tesla.vercel.app](https://tina-3d-tesla.vercel.app/)

**397 指可交互网格部件数量，不代表 397 个经过特斯拉官方核实的真实零件。** 模型网格可能与真实零件一对多或多对一。展开方向和排列仅供视觉观察，不代表真实装配关系、维修顺序或工程级 CAD 数据。

## 本地启动

使用 Node.js 22.13 或更高版本（本次部署使用 Node.js 24）和 npm：

```sh
git clone https://github.com/Tina2088/tina-3d-tesla.git
cd tina-3d-tesla
npm ci
npm run dev:vercel
```

打开终端显示的本地地址。仓库已包含处理好的 GLB，正常运行不需要 Python、私有插件或额外下载模型。

```sh
npm run typecheck
npm run validate:model
npm run build:vercel
npm run preview:vercel
```

## 部署到 Vercel

在 Vercel 中导入本仓库或你的 Fork。根目录的 `vercel.json` 已配置：

- Framework：Vite
- Install Command：`npm ci`
- Build Command：`npm run build:vercel`
- Output Directory：`dist-vercel`
- 不需要环境变量；模型及署名文件作为静态资源发布。

也可以在登录自己的 Vercel 账号后执行 `vercel --prod`。通过 GitHub 集成连接项目后，默认生产分支的更新会触发部署。

Vercel 入口 `main.tsx` 直接复用 `app/page.tsx` 与同一个 Three.js 场景。原有 `npm run dev` / `npm run build` 为 Vinext + Sites / Cloudflare 工作流；Vercel 使用单独配置，不执行 Cloudflare Worker 构建。`.openai/hosting.json` 是原站的历史托管元数据，复现项目不要用其中的标识向原站发布。

## 功能与技术

- React 19、TypeScript、Three.js、Vite 8、Tailwind CSS 4、Base UI / shadcn。
- 冷白、银灰、石墨与钴蓝界面；TINA SVG 字标，紧凑桌面布局和移动端面板。
- 鼠标拖动旋转、滚轮缩放；触屏旋转与双指缩放。
- 0–100% 视觉展开：原始装配外观 → 结构展开 → 独立网格阵列。
- 397 个网格对象可从目录选择；支持分类、高亮、隔离、相机预设与线框。
- 默认中文，可切换英文；减少动态效果设置会影响动画和自动旋转。
- 最终阵列在预设观察方向下按投影包围盒留出间距。自由旋转后仍可能遮挡。

## 模型来源与许可

模型：[Tesla Model Y 2021](https://sketchfab.com/3d-models/tesla-model-y-2021-c0a86cac582d4b33aba0fb1b1912d970)。作者：[763468712](https://sketchfab.com/763468712)。许可：[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。原始下载来自 FetchCFD 的 project 3029 模型查看器所引用的公开素材。

原作者完成车辆建模。本项目的离线脚本进行坐标归一化、连通网格岛拆分、碎片归并、减面和材质调整。处理后模型为 **18,451,072 字节、727,651 个三角面、397 个网格对象**。`MY-001` 等编号是项目内部网格 ID，不是官方零件号；没有虚构电池或电驱内部结构。

模型 SHA-256：

```text
587753DEB9744419154CD7A67F3C77C57F07C31C3F8D01A28B4D4676024C1E3A
```

网站代码采用 [MIT](LICENSE) 许可。**模型继续采用 CC BY 4.0，不改为 MIT。** 再发布时保留模型作者、来源、许可链接与改动说明，详见 [模型署名](public/models/LICENSE.txt) 和 [第三方说明](THIRD_PARTY_NOTICES.md)。

交互思路曾参考 [model-x-studio](https://github.com/ashemag/model-x-studio) 的渐进展开与独立观察。本项目使用 Model Y 素材；启动或部署无需该参考仓库。

## 项目结构

```text
app/page.tsx                 双语界面与交互状态
app/vehicle-scene.tsx        模型加载、相机、射线拾取、材质和渲染
app/explosion.ts            结构偏移与阵列排布
app/parts.json              网格目录及包围盒
app/globals.css             紧凑响应式布局
main.tsx / index.html       Vercel 静态网站入口
vite.vercel.config.ts       Vercel 构建
vercel.json                 部署配置
public/models/              GLB 与模型署名
public/brand/               TINA 字标
scripts/prepare-model.py    可选：原始模型离线处理
scripts/validate-model.mjs  模型、索引与阵列几何检查
```

## 可选：从原始素材重新处理

正常开发不需要此步骤。拥有原始 `scene.gltf`、`scene.bin` 与许可文件时，可使用：

```sh
python -m pip install numpy scipy fast-simplification
python scripts/prepare-model.py INPUT_DIRECTORY OUTPUT_DIRECTORY
```

将结果中的 `model-y.glb`、许可文件复制到 `public/models/`，将 `parts.json` 复制到 `app/`。检查原始模型许可，并保留作者署名。此脚本是网格处理，不是从零生成车辆模型。

## 验证与已知限制

模型检查覆盖唯一 ID、397 个网格与目录对应、有效顶点、最终阵列不重叠及三种视口比例的相机覆盖。TypeScript 与 Vercel 生产构建使用上述命令验证。几何检查不等同于真实浏览器交互或帧率测试；WebGL 效果和性能取决于设备及浏览器。可选 WebMCP 方法通过特性检测注册，浏览器不支持时不影响常规交互。

Tina AI 独立设计探索，非特斯拉官方产品。

Tina AI independent design exploration. Not affiliated with Tesla.
